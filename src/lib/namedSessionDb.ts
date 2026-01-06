// 数据结构
export interface NamedSession {
  id: string;                    // 会话ID（主键）
  name: string;                  // 会话名称
  projectPath: string;           // 项目路径
  projectId: string;             // 项目ID
  engine: 'claude' | 'codex' | 'gemini';
  createdAt: number;             // 会话创建时间
  namedAt: number;               // 命名时间
  firstMessage?: string;         // 第一条消息
  lastMessageTimestamp?: string; // 最后消息时间
}

const DB_NAME = 'named_sessions_db';
const DB_VERSION = 2;
const STORE_NAME = 'named_sessions';

let dbInstance: IDBDatabase | null = null;

// 初始化数据库
export async function initDB(): Promise<IDBDatabase> {
  console.log('[namedSessionDb] 初始化数据库');

  if (dbInstance) {
    console.log('[namedSessionDb] 数据库已存在，返回现有实例');
    return dbInstance;
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('[namedSessionDb] 数据库打开失败:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      console.log('[namedSessionDb] 数据库打开成功');
      dbInstance = request.result;
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      console.log('[namedSessionDb] 执行数据库升级:', JSON.stringify({
        oldVersion: event.oldVersion,
        newVersion: event.newVersion
      }));
      const db = (event.target as IDBOpenDBRequest).result;

      if (event.oldVersion < 1) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          console.log('[namedSessionDb] 创建对象存储:', STORE_NAME);
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('by-namedAt', 'namedAt', { unique: false });
          store.createIndex('by-engine', 'engine', { unique: false });
          console.log('[namedSessionDb] 索引创建完成');
        }
      }

      if (event.oldVersion < 2 && event.oldVersion >= 1) {
        console.log('[namedSessionDb] 升级到版本 2: 添加 project_id 字段');
        const transaction = (event.target as IDBOpenDBRequest).transaction;
        if (transaction) {
          const objectStore = transaction.objectStore(STORE_NAME);
          const cursorRequest = objectStore.openCursor();

          cursorRequest.onsuccess = (e) => {
            const cursor = (e.target as IDBRequest<IDBCursorWithValue>).result;
            if (cursor) {
              const record = cursor.value as NamedSession;
              if (!record.projectId) {
                record.projectId = '';
                cursor.update(record);
                console.log('[namedSessionDb] 迁移记录:', JSON.stringify({ id: record.id }));
              }
              cursor.continue();
            } else {
              console.log('[namedSessionDb] 数据迁移完成');
            }
          };

          cursorRequest.onerror = () => {
            console.error('[namedSessionDb] 数据迁移失败:', cursorRequest.error);
          };
        }
      }
    };
  });
}

// 添加命名会话
export async function addNamedSession(session: NamedSession): Promise<void> {
  console.log('[namedSessionDb] 添加命名会话:', JSON.stringify(session));

  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.add(session);

    request.onsuccess = () => {
      console.log('[namedSessionDb] 命名会话添加成功');
      resolve();
    };

    request.onerror = () => {
      console.error('[namedSessionDb] 添加命名会话失败:', request.error);
      reject(request.error);
    };
  });
}

// 获取所有命名会话（按命名时间倒序）
export async function getAllNamedSessions(): Promise<NamedSession[]> {
  console.log('[namedSessionDb] 获取所有命名会话');

  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('by-namedAt');
    const request = index.openCursor(null, 'prev'); // 倒序

    const sessions: NamedSession[] = [];

    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result;
      if (cursor) {
        sessions.push(cursor.value);
        cursor.continue();
      } else {
        console.log('[namedSessionDb] 获取到命名会话数量:', sessions.length);
        resolve(sessions);
      }
    };

    request.onerror = () => {
      console.error('[namedSessionDb] 获取命名会话失败:', request.error);
      reject(request.error);
    };
  });
}

// 获取单个命名会话
export async function getNamedSession(id: string): Promise<NamedSession | undefined> {
  console.log('[namedSessionDb] 获取命名会话:', id);

  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(id);

    request.onsuccess = () => {
      const session = request.result;
      if (session) {
        console.log('[namedSessionDb] 找到命名会话:', JSON.stringify(session));
      } else {
        console.log('[namedSessionDb] 未找到命名会话:', id);
      }
      resolve(session);
    };

    request.onerror = () => {
      console.error('[namedSessionDb] 获取命名会话失败:', request.error);
      reject(request.error);
    };
  });
}

// 更新会话名称
export async function updateSessionName(id: string, newName: string): Promise<void> {
  console.log('[namedSessionDb] 更新会话名称:', JSON.stringify({ id, newName }));

  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const getRequest = store.get(id);

    getRequest.onsuccess = () => {
      const session = getRequest.result;
      if (!session) {
        console.error('[namedSessionDb] 会话不存在:', id);
        reject(new Error(`Session not found: ${id}`));
        return;
      }

      session.name = newName;
      const putRequest = store.put(session);

      putRequest.onsuccess = () => {
        console.log('[namedSessionDb] 会话名称更新成功');
        resolve();
      };

      putRequest.onerror = () => {
        console.error('[namedSessionDb] 更新会话名称失败:', putRequest.error);
        reject(putRequest.error);
      };
    };

    getRequest.onerror = () => {
      console.error('[namedSessionDb] 获取会话失败:', getRequest.error);
      reject(getRequest.error);
    };
  });
}

// 删除命名会话
export async function deleteNamedSession(id: string): Promise<void> {
  console.log('[namedSessionDb] 删除命名会话:', id);

  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => {
      console.log('[namedSessionDb] 命名会话删除成功');
      resolve();
    };

    request.onerror = () => {
      console.error('[namedSessionDb] 删除命名会话失败:', request.error);
      reject(request.error);
    };
  });
}

// 检查会话是否已命名
export async function isSessionNamed(id: string): Promise<boolean> {
  console.log('[namedSessionDb] 检查会话是否已命名:', id);

  const session = await getNamedSession(id);
  const isNamed = !!session;
  console.log('[namedSessionDb] 会话命名状态:', isNamed);
  return isNamed;
}

// 清空所有命名会话（用于测试）
export async function clearAllNamedSessions(): Promise<void> {
  console.log('[namedSessionDb] 清空所有命名会话');

  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.clear();

    request.onsuccess = () => {
      console.log('[namedSessionDb] 所有命名会话已清空');
      resolve();
    };

    request.onerror = () => {
      console.error('[namedSessionDb] 清空命名会话失败:', request.error);
      reject(request.error);
    };
  });
}
