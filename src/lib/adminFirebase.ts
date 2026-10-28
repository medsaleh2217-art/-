import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { app } from './firebase';

/** يُستورد فقط من لوحة التحكم حتى لا يُحمّل الزوار مكتبات Auth/Storage */
export const auth = app ? getAuth(app) : null;
export const storage = app ? getStorage(app) : null;
