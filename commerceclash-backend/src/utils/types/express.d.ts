import { User } from '@supabase/supabase-js';
// Global request for Modified User and Complete User in MiddleWare
declare global {
  namespace Express {
    interface Request {
      user: User;
      complete_user?: any;
    }
  }
}

export {};
