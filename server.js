const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 8911;
const HOST = process.env.PORT ? '0.0.0.0' : '127.0.0.1';

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ===== File-based Database =====
const DATA_DIR = process.env.DATA_DIR || __dirname;
const DB_PATH = path.join(DATA_DIR, 'data.json');

function loadDB() {
  try {
    if (fs.existsSync(DB_PATH)) {
      return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
    }
  } catch (e) { /* ignore */ }
  return null;
}

function saveDB(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
}

function getDB() {
  let db = loadDB();
  if (!db) {
    db = createDefaultDB();
    saveDB(db);
  }
  return db;
}

function createDefaultDB() {
  const now = Date.now();
  return {
    campuses: [
      { id: 'c1', name: '荃灣西校區', address: '荃灣西', banner: '' },
      { id: 'c2', name: '沙田石門校區', address: '沙田石門', banner: '' },
      { id: 'c3', name: '荔枝角校區', address: '荔枝角', banner: '' },
      { id: 'c4', name: '港大西寶城校區', address: '西寶城', banner: '' },
      { id: 'c5', name: '天后校區', address: '天后', banner: '' }
    ],
    courses: [
      { id: 'co1', campus_id: 'c1', grade: 'P3', subject: '數學', weekday: '週六', time_slot: '上午（0830-1200）', notes: '數學思維班', teacher_name: '陳老師', max_capacity: 20, min_count: 8, created_at: now - 86400000*2 },
      { id: 'co2', campus_id: 'c1', grade: 'P5', subject: '英語（僅限幼兒年級）', weekday: '週日', time_slot: '下午（1300-1700）', notes: '英語強化班', teacher_name: '張老師', max_capacity: 20, min_count: 8, created_at: now - 86400000*3 },
      { id: 'co3', campus_id: 'c2', grade: 'K3', subject: '數學', weekday: '週六', time_slot: '上午（0830-1200）', notes: '數學啟蒙班', teacher_name: '李老師', max_capacity: 15, min_count: 6, created_at: now - 86400000 },
      { id: 'co4', campus_id: 'c2', grade: 'P4', subject: '數學', weekday: '週日', time_slot: '下午（1300-1700）', notes: '數學培優班', teacher_name: '王老師', max_capacity: 20, min_count: 8, created_at: now - 86400000*4 },
      { id: 'co5', campus_id: 'c3', grade: 'K2', subject: '數學', weekday: '週六', time_slot: '上午（0830-1200）', notes: '趣味科學班', teacher_name: '林老師', max_capacity: 15, min_count: 6, created_at: now - 86400000*5 }
    ],
    registrations: [
      { id: 'r1', course_id: 'co1', phone: '13800001111', student_name: '王小明', notes: '', created_at: now - 86400000 },
      { id: 'r2', course_id: 'co1', phone: '13800002222', student_name: '李小華', notes: '希望早點開班', created_at: now - 43200000 },
      { id: 'r3', course_id: 'co2', phone: '13900003333', student_name: '張小美', notes: '', created_at: now - 86400000*2 },
      { id: 'r4', course_id: 'co3', phone: '13700004444', student_name: '陳小偉', notes: '', created_at: now - 3600000 }
    ],
    posts: [
      { id: 'p1', nickname: '東區媽媽', content: '請問各位家長，荃灣西校區的數學思維班老師教得怎麼樣？', created_at: now - 86400000*2, likes: 5 },
      { id: 'p2', nickname: '金橋爸爸', content: '建議學校在沙田石門校區多開一些週末的英語班，很多家長都有這個需求！', created_at: now - 86400000, likes: 12 },
      { id: 'p3', nickname: '匿名家長', content: '孩子最近愛上了編程，不知道學而思有沒有相關的課程推薦？', created_at: now - 3600000, likes: 3 }
    ],
    activities: [
      { id: 'a1', title: '暑期團課早鳥優惠', content: '7月31日前報名可享9折優惠！', campus_id: '', created_at: now - 86400000*7 },
      { id: 'a2', title: '新校區開放日', content: '荃灣西校區將於7月15日舉辦開放日活動，歡迎家長蒞臨參觀！', campus_id: 'c1', created_at: now - 86400000*3 }
    ],
    settings: {
      bannerTitle: '學而思新校區團課平台',
      bannerSubtitle: '促團成班，讓我們傾聽您的聲音。',
      bannerImage: '',
      courseMinCount: '8'
    },
    teachers: [
      { username: 'admin', password: 'admin123', name: '管理員' },
      { username: 'teacher', password: 'teacher123', name: '張老師' },
      { username: '395229', password: '1234567a', name: '管理員' }
    ]
  };
}

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2,6);
}

// ===== API Routes =====

// Settings
app.get('/api/settings', (req, res) => {
  const db = getDB();
  res.json(db.settings);
});

app.put('/api/settings', (req, res) => {
  const db = getDB();
  Object.assign(db.settings, req.body);
  saveDB(db);
  res.json({ success: true });
});

// Auth
app.post('/api/auth/login', (req, res) => {
  const db = getDB();
  const { username, password } = req.body;
  const teacher = db.teachers.find(t => t.username === username && t.password === password);
  if (teacher) {
    res.json({ success: true, username: teacher.username, name: teacher.name });
  } else {
    res.json({ success: false, message: '帳號或密碼錯誤' });
  }
});

// Campuses
app.get('/api/campuses', (req, res) => {
  const db = getDB();
  res.json(db.campuses);
});

app.post('/api/campuses', (req, res) => {
  const db = getDB();
  const { name, address } = req.body;
  const campus = { id: genId(), name, address: address || '', banner: '' };
  db.campuses.push(campus);
  saveDB(db);
  res.json(campus);
});

app.delete('/api/campuses/:id', (req, res) => {
  const db = getDB();
  db.courses = db.courses.filter(c => c.campus_id !== req.params.id);
  db.registrations = db.registrations.filter(r => !db.courses.some(c => c.id === r.course_id));
  db.campuses = db.campuses.filter(c => c.id !== req.params.id);
  saveDB(db);
  res.json({ success: true });
});

app.put('/api/campuses/:id', (req, res) => {
  const db = getDB();
  const { name, address } = req.body;
  const campus = db.campuses.find(c => c.id === req.params.id);
  if (campus) {
    if (name) campus.name = name;
    if (address !== undefined) campus.address = address;
    saveDB(db);
    res.json({ success: true, campus });
  } else {
    res.status(404).json({ success: false, message: '校區不存在' });
  }
});

// Courses
app.get('/api/courses', (req, res) => {
  const db = getDB();
  let courses = [...db.courses].sort((a, b) => b.created_at - a.created_at);
  if (req.query.campusId) {
    courses = courses.filter(c => c.campus_id === req.query.campusId);
  }
  res.json(courses);
});

app.post('/api/courses', (req, res) => {
  const db = getDB();
  const { campusId, grade, weekday, timeSlot, notes, minCount, teacherName, maxCapacity } = req.body;
  const course = { id: genId(), campus_id: campusId, grade, weekday, time_slot: timeSlot, notes: notes || '', teacher_name: teacherName || '', max_capacity: maxCapacity || 20, min_count: minCount || 8, created_at: Date.now() };
  db.courses.push(course);
  saveDB(db);
  res.json(course);
});

app.put('/api/courses/:id', (req, res) => {
  const db = getDB();
  const { grade, weekday, timeSlot, notes, minCount, teacherName, maxCapacity } = req.body;
  const course = db.courses.find(c => c.id === req.params.id);
  if (course) {
    if (grade) course.grade = grade;
    if (weekday) course.weekday = weekday;
    if (timeSlot) course.time_slot = timeSlot;
    if (notes !== undefined) course.notes = notes;
    if (minCount) course.min_count = minCount;
    if (teacherName !== undefined) course.teacher_name = teacherName;
    if (maxCapacity) course.max_capacity = maxCapacity;
    saveDB(db);
    res.json({ success: true, course });
  } else {
    res.status(404).json({ success: false, message: '課程不存在' });
  }
});

app.delete('/api/courses/:id', (req, res) => {
  const db = getDB();
  db.registrations = db.registrations.filter(r => r.course_id !== req.params.id);
  db.courses = db.courses.filter(c => c.id !== req.params.id);
  saveDB(db);
  res.json({ success: true });
});

// Registrations
app.get('/api/registrations', (req, res) => {
  const db = getDB();
  let registrations = [...db.registrations].sort((a, b) => b.created_at - a.created_at);
  if (req.query.courseId) {
    registrations = registrations.filter(r => r.course_id === req.query.courseId);
  }
  res.json(registrations);
});

app.post('/api/registrations', (req, res) => {
  const db = getDB();
  const { courseId, phone, studentName, notes } = req.body;
  const exist = db.registrations.find(r => r.course_id === courseId && r.phone === phone);
  if (exist) {
    return res.json({ success: false, message: '您已經報名過該時段了！' });
  }
  const registration = { id: genId(), course_id: courseId, phone, student_name: studentName, notes: notes || '', created_at: Date.now() };
  db.registrations.push(registration);
  saveDB(db);
  res.json({ success: true, id: registration.id });
});

// Posts
app.get('/api/posts', (req, res) => {
  const db = getDB();
  res.json([...db.posts].sort((a, b) => b.created_at - a.created_at));
});

app.post('/api/posts', (req, res) => {
  const db = getDB();
  const { nickname, content } = req.body;
  if (!content) return res.json({ success: false, message: '請輸入內容' });
  const post = { id: genId(), nickname: nickname || '匿名家長', content, created_at: Date.now(), likes: 0, comments: [] };
  db.posts.push(post);
  saveDB(db);
 res.json({ success: true, id: post.id });
});

app.post('/api/posts/:id/like', (req, res) => {
  const db = getDB();
  const post = db.posts.find(p => p.id === req.params.id);
  if (!post) return res.status(404).json({ success: false });
  post.likes = (post.likes || 0) + 1;
  saveDB(db);
  res.json({ success: true, likes: post.likes });
});

app.post('/api/posts/:id/comment', (req, res) => {
  const db = getDB();
  const post = db.posts.find(p => p.id === req.params.id);
  if (!post) return res.status(404).json({ success: false });
  const { content } = req.body;
  if (!content) return res.json({ success: false, message: '請輸入留言內容' });
  if (!post.comments) post.comments = [];
  const comment = { id: genId(), nickname: '匿名家長', content, created_at: Date.now() };
  post.comments.push(comment);
  saveDB(db);
  res.json({ success: true, comment });
});

app.delete('/api/comments/:id', (req, res) => {
  const db = getDB();
  for (const post of db.posts) {
    if (post.comments) {
      const idx = post.comments.findIndex(c => c.id === req.params.id);
      if (idx !== -1) {
        post.comments.splice(idx, 1);
        saveDB(db);
        return res.json({ success: true });
      }
    }
  }
  res.status(404).json({ success: false });
});

app.delete('/api/posts/:id', (req, res) => {
  const db = getDB();
  db.posts = db.posts.filter(p => p.id !== req.params.id);
  saveDB(db);
  res.json({ success: true });
});

// Activities
app.get('/api/activities', (req, res) => {
  const db = getDB();
  res.json([...db.activities].sort((a, b) => b.created_at - a.created_at));
});

app.post('/api/activities', (req, res) => {
  const db = getDB();
  const { title, content, campusId } = req.body;
  const activity = { id: genId(), title, content, campus_id: campusId || '', created_at: Date.now() };
  db.activities.push(activity);
  saveDB(db);
  res.json({ success: true, id: activity.id });
});

app.delete('/api/activities/:id', (req, res) => {
  const db = getDB();
  db.activities = db.activities.filter(a => a.id !== req.params.id);
  saveDB(db);
  res.json({ success: true });
});

// Serve Frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, HOST, () => {
  console.log(`✅ 學而思團課平台伺服器啟動成功！`);
  console.log(`🌐 請訪問 http://127.0.0.1:${PORT}`);
});
