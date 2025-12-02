import { Request } from 'express';

type RPGRequest = Request & { user: UserDocument };
