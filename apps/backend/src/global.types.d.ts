import { Request } from "express";
import { AuthUser } from "./bounded-contexts/auth/domain/entities/AuthUser.js";

type RPGRequest = Request & { user: AuthUser };
