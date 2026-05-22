const admin = require('firebase-admin');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

// ── Firebase Configuration & Initialization ─────────────────
let db = null;
let useLocalDb = true;
const LOCAL_DB_PATH = path.join(__dirname, '../localDb.json');

// Helper to generate 24-character hex ID (similar to MongoDB ObjectId)
function generateId() {
  return [...Array(24)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');
}

// Haversine formula to compute distance in meters between two coordinates
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // metres
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // in metres
}

function initializeFirebase() {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (projectId && clientEmail && privateKey) {
    try {
      const formattedPrivateKey = privateKey.replace(/\\n/g, '\n');
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey: formattedPrivateKey,
        }),
      });
      db = admin.firestore();
      useLocalDb = false;
      console.log('✅ Firebase Firestore Initialized Successfully');
      return;
    } catch (error) {
      console.error('❌ Failed to initialize Firebase with Service Account:', error.message);
    }
  }

  if (projectId) {
    try {
      admin.initializeApp({ projectId });
      db = admin.firestore();
      useLocalDb = false;
      console.log('✅ Firebase Firestore Initialized via Project ID');
      return;
    } catch (error) {
      console.error('❌ Failed to initialize Firebase via Project ID:', error.message);
    }
  }

  console.log('⚠️  Firebase credentials not provided. Falling back to local JSON Database:', LOCAL_DB_PATH);
  if (!fs.existsSync(LOCAL_DB_PATH)) {
    fs.writeFileSync(
      LOCAL_DB_PATH,
      JSON.stringify({ users: [], venues: [], bookings: [], reviews: [] }, null, 2)
    );
  }
}

// Initialize on load
initializeFirebase();

// ── Local Database Operations (if fallback active) ──────────
function readLocalDb() {
  try {
    const data = fs.readFileSync(LOCAL_DB_PATH, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return { users: [], venues: [], bookings: [], reviews: [] };
  }
}

function writeLocalDb(data) {
  try {
    fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(data, null, 2), 'utf8');
  } catch (error) {
    console.error('❌ Failed to write to local DB:', error.message);
  }
}

// ── Firestore / Local helper functions ───────────────────────
async function fetchAll(collectionName) {
  if (useLocalDb) {
    const local = readLocalDb();
    return local[collectionName] || [];
  } else {
    const snapshot = await db.collection(collectionName).get();
    const list = [];
    snapshot.forEach((doc) => {
      list.push({ _id: doc.id, ...doc.data() });
    });
    return list;
  }
}

async function saveDocument(collectionName, doc) {
  const docData = { ...doc };
  const id = docData._id || generateId();
  delete docData._id;

  // Convert Date fields to ISO string / Dates
  for (const key in docData) {
    if (docData[key] instanceof Date) {
      docData[key] = docData[key].toISOString();
    }
  }

  if (useLocalDb) {
    const local = readLocalDb();
    if (!local[collectionName]) local[collectionName] = [];
    const index = local[collectionName].findIndex((d) => d._id === id);

    const savedDoc = { _id: id, ...docData, createdAt: docData.createdAt || new Date().toISOString(), updatedAt: new Date().toISOString() };
    if (index >= 0) {
      local[collectionName][index] = savedDoc;
    } else {
      local[collectionName].push(savedDoc);
    }
    writeLocalDb(local);
    return savedDoc;
  } else {
    const savedDoc = {
      ...docData,
      createdAt: docData.createdAt || admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    await db.collection(collectionName).doc(id).set(savedDoc, { merge: true });
    // Fetch it back to resolve timestamps
    const ref = await db.collection(collectionName).doc(id).get();
    const data = ref.data();
    return {
      _id: id,
      ...data,
      createdAt: data.createdAt && data.createdAt.toDate ? data.createdAt.toDate().toISOString() : data.createdAt,
      updatedAt: data.updatedAt && data.updatedAt.toDate ? data.updatedAt.toDate().toISOString() : data.updatedAt,
    };
  }
}

async function deleteDocuments(collectionName, query) {
  const docs = await fetchAll(collectionName);
  const matched = filterInMemory(docs, query);

  if (useLocalDb) {
    const local = readLocalDb();
    local[collectionName] = local[collectionName].filter(
      (d) => !matched.some((m) => m._id === d._id)
    );
    writeLocalDb(local);
  } else {
    const batch = db.batch();
    matched.forEach((doc) => {
      const ref = db.collection(collectionName).doc(doc._id);
      batch.delete(ref);
    });
    await batch.commit();
  }
}

// ── In-Memory Query Engine ───────────────────────────────────
function filterInMemory(docs, query) {
  if (!query || Object.keys(query).length === 0) return docs;

  let nearContext = null;

  const filtered = docs.filter((doc) => {
    for (const key in query) {
      const value = query[key];

      // Handle Geospatial proximity query
      if (key === 'location' && value && value.$near) {
        const coordinates = value.$near.$geometry.coordinates; // [lng, lat]
        const maxDist = value.$near.$maxDistance || 10000;
        const docCoordinates = doc.location && doc.location.coordinates;
        if (!docCoordinates) return false;

        const dist = getDistance(
          coordinates[1],
          coordinates[0],
          docCoordinates[1],
          docCoordinates[0]
        );

        if (dist > maxDist) return false;

        nearContext = { coordinates, dists: nearContext?.dists || {} };
        nearContext.dists[doc._id] = dist;
        continue;
      }

      // Handle Text search query
      if (key === '$text' && value && value.$search) {
        const searchTerms = value.$search.toLowerCase().split(/\s+/);
        const docText = `${doc.name || ''} ${doc.description || ''} ${doc.area || ''} ${
          doc.address || ''
        }`.toLowerCase();

        const match = searchTerms.some((term) => docText.includes(term));
        if (!match) return false;
        continue;
      }

      // Handle logical OR
      if (key === '$or' && Array.isArray(value)) {
        const matchOr = value.some((subQuery) => filterInMemory([doc], subQuery).length > 0);
        if (!matchOr) return false;
        continue;
      }

      // Handle nested sports name query like "sports.name"
      if (key === 'sports.name' && typeof value === 'string') {
        const hasSport = doc.sports && doc.sports.some((s) => s.name.toLowerCase() === value.toLowerCase());
        if (!hasSport) return false;
        continue;
      }

      // Standard MongoDB operators: $gte, $lte, $in, $regex
      const docValue = doc[key];
      if (value && typeof value === 'object' && !(value instanceof Date)) {
        if ('$regex' in value) {
          const pattern = value.$regex;
          const options = value.$options || '';
          const regex = new RegExp(pattern, options);
          if (!regex.test(String(docValue || ''))) return false;
        } else if ('$gte' in value) {
          const val = value.$gte;
          const compareVal = docValue instanceof Date ? docValue : new Date(docValue);
          const limitVal = val instanceof Date ? val : new Date(val);
          if (compareVal < limitVal) return false;
        } else if ('$lte' in value) {
          const val = value.$lte;
          const compareVal = docValue instanceof Date ? docValue : new Date(docValue);
          const limitVal = val instanceof Date ? val : new Date(val);
          if (compareVal > limitVal) return false;
        } else if ('$in' in value) {
          const list = value.$in;
          if (!list.includes(docValue)) return false;
        }
      } else {
        // Direct match (handling Object ID / String string comparison)
        const strDocVal = docValue ? docValue.toString() : '';
        const strQueryVal = value ? value.toString() : '';
        if (strDocVal !== strQueryVal) return false;
      }
    }
    return true;
  });

  // Sort near geospatially if Near query was executed
  if (nearContext) {
    filtered.sort((a, b) => nearContext.dists[a._id] - nearContext.dists[b._id]);
  }

  return filtered;
}

// ── Mock Mongoose Internal Maps & Helpers ───────────────────
const registeredModels = {};
const schemas = {};
const modelInfo = {
  users: { modelName: 'User' },
  venues: { modelName: 'Venue' },
  bookings: { modelName: 'Booking' },
  reviews: { modelName: 'Review' }
};

// ── Query Builder class (emulating Mongoose queries) ─────────
class QueryBuilder {
  constructor(collectionName, query = {}) {
    this.collectionName = collectionName;
    this.query = query;
    this.populatePaths = [];
    this.sortOption = null;
    this.limitVal = null;
    this.selectFields = null;
  }

  populate(path, fields) {
    this.populatePaths.push({ path, fields });
    return this;
  }

  sort(option) {
    this.sortOption = option;
    return this;
  }

  limit(val) {
    this.limitVal = val;
    return this;
  }

  select(fields) {
    this.selectFields = fields;
    return this;
  }

  async execute() {
    let docs = await fetchAll(this.collectionName);
    docs = filterInMemory(docs, this.query);

    // Apply sorting
    if (this.sortOption) {
      const keys = Object.keys(this.sortOption);
      if (keys.length > 0) {
        const key = keys[0];
        const order = this.sortOption[key]; // 1 or -1
        docs.sort((a, b) => {
          let valA = a[key];
          let valB = b[key];

          // Nested key (e.g. sports.pricePerHour)
          if (key.includes('.')) {
            const parts = key.split('.');
            valA = a[parts[0]] ? a[parts[0]].map(x => x[parts[1]]) : [];
            valB = b[parts[0]] ? b[parts[0]].map(x => x[parts[1]]) : [];
            valA = Math.min(...valA);
            valB = Math.min(...valB);
          }

          if (valA < valB) return -1 * order;
          if (valA > valB) return 1 * order;
          return 0;
        });
      }
    }

    // Apply limit
    if (this.limitVal !== null) {
      docs = docs.slice(0, this.limitVal);
    }

    // Apply populate
    for (const pop of this.populatePaths) {
      for (const doc of docs) {
        const refId = doc[pop.path];
        if (refId) {
          const targetCollection = pop.path === 'owner' ? 'users' : pop.path === 'user' ? 'users' : pop.path === 'venue' ? 'venues' : null;
          if (targetCollection) {
            const allTargets = await fetchAll(targetCollection);
            const found = allTargets.find((t) => t._id.toString() === refId.toString());
            if (found) {
              doc[pop.path] = found;
            }
          }
        }
      }
    }

    const info = modelInfo[this.collectionName];
    const modelClass = info ? registeredModels[info.modelName] : null;
    const sch = info ? schemas[info.modelName] : null;

    // Wrap objects to doc instances with Mongoose methods
    return docs.map((d) => wrapDocument(this.collectionName, d, sch, modelClass));
  }

  // Support thenable/awaitable
  then(onfulfilled, onrejected) {
    return this.execute().then(onfulfilled, onrejected);
  }

  catch(onrejected) {
    return this.execute().catch(onrejected);
  }
}

// Wrap plain object with mongoose-like document helper methods
function wrapDocument(collectionName, plainObj, schema, ModelClass) {
  if (!plainObj) return null;

  const doc = { ...plainObj };
  const originalData = { ...plainObj };

  // Set constructor to ModelClass
  if (ModelClass) {
    Object.defineProperty(doc, 'constructor', {
      value: ModelClass,
      writable: true,
      configurable: true,
      enumerable: false
    });
  }

  // Copy methods from schema
  if (schema && schema.methods) {
    for (const key in schema.methods) {
      doc[key] = schema.methods[key].bind(doc);
    }
  }

  doc.isModified = function (path) {
    return doc[path] !== originalData[path];
  };

  doc.toObject = function () {
    const obj = { ...this };
    delete obj.toObject;
    delete obj.save;
    delete obj.deleteOne;
    delete obj.matchPassword;
    delete obj.isModified;
    return obj;
  };

  doc.save = async function () {
    // Run pre save hooks
    if (schema && schema._preHooks && schema._preHooks['save']) {
      for (const hook of schema._preHooks['save']) {
        await new Promise((resolve, reject) => {
          const next = (err) => {
            if (err) reject(err);
            else resolve();
          };
          const res = hook.call(this, next);
          if (res && typeof res.then === 'function') {
            res.then(() => resolve()).catch(reject);
          } else if (hook.length === 0) {
            resolve();
          }
        });
      }
    }

    const saved = await saveDocument(collectionName, this.toObject());
    Object.assign(this, saved);

    // Run post save hooks
    if (schema && schema._postHooks && schema._postHooks['save']) {
      for (const hook of schema._postHooks['save']) {
        await new Promise((resolve, reject) => {
          const next = (err) => {
            if (err) reject(err);
            else resolve();
          };
          const res = hook.call(this, this, next);
          if (res && typeof res.then === 'function') {
            res.then(() => resolve()).catch(reject);
          } else if (hook.length <= 1) {
            resolve();
          }
        });
      }
    }

    return this;
  };

  doc.deleteOne = async function () {
    // Run pre deleteOne hooks
    if (schema && schema._preHooks && schema._preHooks['deleteOne']) {
      for (const hook of schema._preHooks['deleteOne']) {
        await new Promise((resolve, reject) => {
          const next = (err) => {
            if (err) reject(err);
            else resolve();
          };
          const res = hook.call(this, next);
          if (res && typeof res.then === 'function') {
            res.then(() => resolve()).catch(reject);
          } else if (hook.length === 0) {
            resolve();
          }
        });
      }
    }

    await deleteDocuments(collectionName, { _id: this._id });

    // Run post deleteOne hooks
    if (schema && schema._postHooks && schema._postHooks['deleteOne']) {
      for (const hook of schema._postHooks['deleteOne']) {
        await new Promise((resolve, reject) => {
          const next = (err) => {
            if (err) reject(err);
            else resolve();
          };
          const res = hook.call(this, this, next);
          if (res && typeof res.then === 'function') {
            res.then(() => resolve()).catch(reject);
          } else if (hook.length <= 1) {
            resolve();
          }
        });
      }
    }

    return this;
  };

  // Add matchPassword for User docs
  if (collectionName === 'users') {
    doc.matchPassword = async function (enteredPassword) {
      // Find user from DB with password included
      const allUsers = await fetchAll('users');
      const fullUser = allUsers.find((u) => u._id === this._id);
      if (!fullUser || !fullUser.password) return false;
      return await bcrypt.compare(enteredPassword, fullUser.password);
    };
  }

  return doc;
}

// ── Model Factory function ──────────────────────────────────
function createModel(modelName, schema) {
  const collectionName = modelName.toLowerCase() + 's';

  const ModelClass = {
    find(query) {
      return new QueryBuilder(collectionName, query);
    },

    findOne(query) {
      const qb = new QueryBuilder(collectionName, query);
      const originalExecute = qb.execute.bind(qb);
      qb.execute = async () => {
        const results = await originalExecute();
        return results.length > 0 ? results[0] : null;
      };
      return qb;
    },

    findById(id) {
      return this.findOne({ _id: id });
    },

    async create(data) {
      if (Array.isArray(data)) {
        const results = [];
        for (const item of data) {
          const doc = wrapDocument(collectionName, item, schema, ModelClass);
          if (collectionName === 'users' && doc.password) {
            const salt = await bcrypt.genSalt(10);
            doc.password = await bcrypt.hash(doc.password, salt);
          }
          const saved = await saveDocument(collectionName, doc.toObject());
          results.push(wrapDocument(collectionName, saved, schema, ModelClass));
        }
        return results;
      } else {
        const doc = wrapDocument(collectionName, data, schema, ModelClass);
        if (collectionName === 'users' && doc.password) {
          const salt = await bcrypt.genSalt(10);
          doc.password = await bcrypt.hash(doc.password, salt);
        }
        const saved = await saveDocument(collectionName, doc.toObject());
        return wrapDocument(collectionName, saved, schema, ModelClass);
      }
    },

    async insertMany(data) {
      return await this.create(data);
    },

    async findByIdAndUpdate(id, updateData, options = {}) {
      const allDocs = await fetchAll(collectionName);
      const doc = allDocs.find((d) => d._id === id);
      if (!doc) return null;

      const merged = { ...doc, ...updateData };
      const saved = await saveDocument(collectionName, merged);
      return wrapDocument(collectionName, saved, schema, ModelClass);
    },

    async deleteMany(query) {
      await deleteDocuments(collectionName, query);
      return { deletedCount: 1 }; // Mock result
    },

    async countDocuments(query) {
      const docs = await fetchAll(collectionName);
      const matched = filterInMemory(docs, query);
      return matched.length;
    },

    async distinct(field) {
      const docs = await fetchAll(collectionName);
      const values = new Set();
      docs.forEach((doc) => {
        // Handle nested fields like sports.name
        if (field.includes('.')) {
          const parts = field.split('.');
          const arr = doc[parts[0]];
          if (Array.isArray(arr)) {
            arr.forEach((item) => {
              if (item[parts[1]]) values.add(item[parts[1]]);
            });
          }
        } else {
          if (doc[field]) values.add(doc[field]);
        }
      });
      return Array.from(values);
    },

    async aggregate(pipeline) {
      let docs = await fetchAll(collectionName);

      for (const stage of pipeline) {
        if (stage.$match) {
          docs = filterInMemory(docs, stage.$match);
        } else if (stage.$group) {
          const groupKey = stage.$group._id; // string or object
          const groups = {};

          docs.forEach((doc) => {
            let keyVal = null;
            if (typeof groupKey === 'string' && groupKey.startsWith('$')) {
              const field = groupKey.slice(1);
              // Handle monthly groupings
              if (field === 'month') {
                // mock month extraction if needed
              }
              keyVal = doc[field];
            } else if (groupKey && typeof groupKey === 'object') {
              const keys = Object.keys(groupKey);
              if (keys.length > 0) {
                const subKey = groupKey[keys[0]].slice(1); // e.g. $createdAt
                if (subKey === 'createdAt' || subKey === 'date') {
                  const date = new Date(doc[subKey]);
                  keyVal = date.getMonth() + 1; // Month index 1-12
                } else {
                  keyVal = doc[subKey];
                }
              }
            }

            const gId = keyVal !== null && keyVal !== undefined ? keyVal.toString() : 'null';
            if (!groups[gId]) {
              groups[gId] = { _id: keyVal, count: 0, items: [] };
            }
            groups[gId].count += 1;
            groups[gId].items.push(doc);
          });

          // Compute group aggregates
          const groupResults = [];
          for (const gId in groups) {
            const group = groups[gId];
            const result = { _id: group._id };

            for (const key in stage.$group) {
              if (key === '_id') continue;
              const operation = stage.$group[key];

              if (operation.$sum) {
                const sumExpr = operation.$sum;
                if (typeof sumExpr === 'number') {
                  result[key] = group.items.length * sumExpr;
                } else if (typeof sumExpr === 'string' && sumExpr.startsWith('$')) {
                  const field = sumExpr.slice(1);
                  result[key] = group.items.reduce((sum, item) => sum + (parseFloat(item[field]) || 0), 0);
                }
              } else if (operation.$avg) {
                const avgExpr = operation.$avg;
                if (typeof avgExpr === 'string' && avgExpr.startsWith('$')) {
                  const field = avgExpr.slice(1);
                  const sum = group.items.reduce((s, item) => s + (parseFloat(item[field]) || 0), 0);
                  result[key] = group.items.length > 0 ? sum / group.items.length : 0;
                }
              }
            }
            groupResults.push(result);
          }
          docs = groupResults;
        } else if (stage.$sort) {
          const sortKey = Object.keys(stage.$sort)[0];
          const sortOrder = stage.$sort[sortKey];
          docs.sort((a, b) => {
            const valA = a[sortKey];
            const valB = b[sortKey];
            if (valA < valB) return -1 * sortOrder;
            if (valA > valB) return 1 * sortOrder;
            return 0;
          });
        }
      }

      return docs;
    },
  };

  // Copy statics from schema
  if (schema && schema.statics) {
    for (const key in schema.statics) {
      ModelClass[key] = schema.statics[key].bind(ModelClass);
    }
  }

  return ModelClass;
}

// ── Mock Mongoose API ────────────────────────────────────────

const mongooseMock = {
  Schema: class {
    constructor(fields, options) {
      this.fields = fields;
      this.options = options;
      this.methods = {};
      this.statics = {};
      this._preHooks = {};
      this._postHooks = {};
    }
    index() {}
    pre(hookName, fn) {
      if (!this._preHooks[hookName]) this._preHooks[hookName] = [];
      this._preHooks[hookName].push(fn);
    }
    post(hookName, options, fn) {
      let actualFn = fn;
      if (typeof options === 'function') {
        actualFn = options;
      }
      if (!this._postHooks[hookName]) this._postHooks[hookName] = [];
      this._postHooks[hookName].push(actualFn);
    }
  },

  model(name, schema) {
    if (!schema) {
      return registeredModels[name];
    }
    const model = createModel(name, schema);
    registeredModels[name] = model;
    schemas[name] = schema;
    return model;
  },

  connection: {
    readyState: 1, // Always mock connected
  },

  Types: {
    ObjectId: class {
      constructor(id) {
        this.id = id || generateId();
      }
      toString() {
        return this.id;
      }
    },
  },
};

module.exports = mongooseMock;
