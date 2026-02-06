import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock dependencies before importing controller
vi.mock("../db.js", () => ({
  pool: { query: vi.fn() },
}));

vi.mock("bcrypt", () => ({
  default: {
    hash: vi.fn(),
    compare: vi.fn(),
  },
}));

vi.mock("jsonwebtoken", () => ({
  default: {
    sign: vi.fn(() => "mock-jwt-token"),
    verify: vi.fn(),
  },
}));

vi.mock("../services/email.service.js", () => ({
  sendPasswordResetEmail: vi.fn(() => Promise.resolve()),
  sendWelcomeEmail: vi.fn(() => Promise.resolve()),
}));

// Import after mocks are set up
import { pool } from "../db.js";
import bcrypt from "bcrypt";
import {
  customerRegister,
  customerLogin,
  customerLogout,
} from "../controllers/customer.auth.controller.js";

// Helper to create mock request/response
function createMockReqRes(body = {}, cookies = {}) {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    cookie: vi.fn().mockReturnThis(),
    clearCookie: vi.fn().mockReturnThis(),
  };
  const req = { body, cookies };
  return { req, res };
}

describe("Customer Auth Controller", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.JWT_SECRET = "test-secret";
    process.env.NODE_ENV = "test";
  });

  describe("customerRegister", () => {
    it("returns 400 if required fields are missing", async () => {
      const { req, res } = createMockReqRes({ email: "test@example.com" });

      await customerRegister(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "All fields are required",
      });
    });

    it("returns 400 for invalid email format", async () => {
      const { req, res } = createMockReqRes({
        email: "not-an-email",
        password: "password123",
        firstName: "John",
        lastName: "Doe",
      });

      await customerRegister(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: "Invalid email format" });
    });

    it("returns 400 if password is less than 8 characters", async () => {
      const { req, res } = createMockReqRes({
        email: "test@example.com",
        password: "short",
        firstName: "John",
        lastName: "Doe",
      });

      await customerRegister(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Password must be at least 8 characters",
      });
    });

    it("returns 409 if email already exists", async () => {
      pool.query.mockResolvedValueOnce({ rows: [{ id: 1 }] });

      const { req, res } = createMockReqRes({
        email: "existing@example.com",
        password: "password123",
        firstName: "John",
        lastName: "Doe",
      });

      await customerRegister(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        error: "Email already registered",
      });
    });

    it("successfully registers a new user", async () => {
      pool.query
        .mockResolvedValueOnce({ rows: [] }) // No existing user
        .mockResolvedValueOnce({
          rows: [
            {
              id: 1,
              email: "new@example.com",
              first_name: "John",
              last_name: "Doe",
              role: "customer",
            },
          ],
        });

      bcrypt.hash.mockResolvedValue("hashed-password");

      const { req, res } = createMockReqRes({
        email: "new@example.com",
        password: "password123",
        firstName: "John",
        lastName: "Doe",
      });

      await customerRegister(req, res);

      expect(bcrypt.hash).toHaveBeenCalledWith("password123", 12);
      expect(res.cookie).toHaveBeenCalledWith(
        "albakes_customer",
        "mock-jwt-token",
        expect.any(Object)
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        ok: true,
        user: {
          id: 1,
          email: "new@example.com",
          firstName: "John",
          lastName: "Doe",
        },
      });
    });
  });

  describe("customerLogin", () => {
    it("returns 400 if email or password missing", async () => {
      const { req, res } = createMockReqRes({ email: "test@example.com" });

      await customerLogin(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Email and password required",
      });
    });

    it("returns 401 for non-existent user", async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });

      const { req, res } = createMockReqRes({
        email: "nonexistent@example.com",
        password: "password123",
      });

      await customerLogin(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: "Invalid credentials" });
    });

    it("returns 401 for deactivated account", async () => {
      pool.query.mockResolvedValueOnce({
        rows: [
          {
            id: 1,
            email: "inactive@example.com",
            password_hash: "hash",
            is_active: false,
          },
        ],
      });

      const { req, res } = createMockReqRes({
        email: "inactive@example.com",
        password: "password123",
      });

      await customerLogin(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: "Account is deactivated",
      });
    });

    it("returns 401 for wrong password", async () => {
      pool.query.mockResolvedValueOnce({
        rows: [
          {
            id: 1,
            email: "user@example.com",
            password_hash: "correct-hash",
            is_active: true,
          },
        ],
      });

      bcrypt.compare.mockResolvedValue(false);

      const { req, res } = createMockReqRes({
        email: "user@example.com",
        password: "wrong-password",
      });

      await customerLogin(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: "Invalid credentials" });
    });

    it("successfully logs in valid user", async () => {
      pool.query.mockResolvedValueOnce({
        rows: [
          {
            id: 1,
            email: "user@example.com",
            password_hash: "correct-hash",
            first_name: "John",
            last_name: "Doe",
            is_active: true,
          },
        ],
      });

      bcrypt.compare.mockResolvedValue(true);

      const { req, res } = createMockReqRes({
        email: "user@example.com",
        password: "correct-password",
      });

      await customerLogin(req, res);

      expect(res.cookie).toHaveBeenCalledWith(
        "albakes_customer",
        "mock-jwt-token",
        expect.any(Object)
      );
      expect(res.json).toHaveBeenCalledWith({
        ok: true,
        user: {
          id: 1,
          email: "user@example.com",
          firstName: "John",
          lastName: "Doe",
        },
      });
    });
  });

  describe("customerLogout", () => {
    it("clears the auth cookie and returns ok", () => {
      const { req, res } = createMockReqRes();

      customerLogout(req, res);

      expect(res.clearCookie).toHaveBeenCalledWith("albakes_customer", {
        path: "/",
      });
      expect(res.json).toHaveBeenCalledWith({ ok: true });
    });
  });
});
