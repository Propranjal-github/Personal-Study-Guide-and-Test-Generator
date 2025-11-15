import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
let client;
let clientPromise;

if (!global._mongoClientPromise) {
  client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  global._mongoClientPromise = client.connect();
}
clientPromise = global._mongoClientPromise;

async function connectToDatabase() {
  const client = await clientPromise;
  const db = client.db('jeeAce');
  return { db, client };
}

async function saveTest(userId, testConfig) {
  const { db } = await connectToDatabase();
  const testsCollection = db.collection('tests');

  const testData = {
    userId,
    testType: testConfig.testType,
    subjects: testConfig.subjects,
    totalQuestions: testConfig.totalQuestions,
    timeLimit: testConfig.timeLimit,
    questions: testConfig.questions,
    createdAt: new Date(),
  };

  const result = await testsCollection.insertOne(testData);
  return result.insertedId;
}

async function saveTestResult(userId, testId, results) {
  const { db } = await connectToDatabase();
  const testsCollection = db.collection('tests');

  await testsCollection.updateOne(
    { _id: testId, userId },
    {
      $set: {
        score: results.score,
        total: results.total,
        percentage: results.percentage,
        detailedResults: results.details,
        completedAt: new Date(),
      },
    }
  );
}

async function getTestHistory(userId) {
  const { db } = await connectToDatabase();
  const testsCollection = db.collection('tests');

  const tests = await testsCollection
    .find({ userId })
    .sort({ createdAt: -1 })
    .toArray();
  return tests;
}

export { connectToDatabase, saveTest, saveTestResult, getTestHistory };