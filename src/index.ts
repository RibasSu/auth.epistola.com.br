import { serve } from "bun";
import index from "./index.html";
import type { Env } from "./types/auth";
import {
  registerUser,
  loginUser,
  logoutUser,
  getUserProfile,
  updateUserProfile,
} from "./api/auth";
import {
  createEpistolary,
  listEpistolaries,
  getEpistolary,
  updateEpistolary,
  deleteEpistolary,
  regenerateSecret,
} from "./api/epistolary";
import { authorize, token, userInfo, revokeToken } from "./api/oauth";
import { errorResponse } from "./lib/auth-utils";

const env: Env = {
  DB: (process as any).env.DB,
  JWT_SECRET: process.env.JWT_SECRET,
  ENVIRONMENT: process.env.ENVIRONMENT,
  SESSION_DURATION: process.env.SESSION_DURATION,
  AUTH_CODE_DURATION: process.env.AUTH_CODE_DURATION,
  ACCESS_TOKEN_DURATION: process.env.ACCESS_TOKEN_DURATION,
  REFRESH_TOKEN_DURATION: process.env.REFRESH_TOKEN_DURATION,
};

const server = serve({
  routes: {
    "/*": index,

    "/api/auth/register": {
      async POST(req) {
        return registerUser(req, env);
      },
      async OPTIONS(req) {
        return new Response(null, {
          status: 204,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
          },
        });
      },
    },

    "/api/auth/login": {
      async POST(req) {
        return loginUser(req, env);
      },
      async OPTIONS(req) {
        return new Response(null, {
          status: 204,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
          },
        });
      },
    },

    "/api/auth/logout": {
      async POST(req) {
        return logoutUser(req, env);
      },
      async OPTIONS(req) {
        return new Response(null, {
          status: 204,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
          },
        });
      },
    },

    "/api/auth/profile": {
      async GET(req) {
        return getUserProfile(req, env);
      },
      async PUT(req) {
        return updateUserProfile(req, env);
      },
      async OPTIONS(req) {
        return new Response(null, {
          status: 204,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, PUT, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
          },
        });
      },
    },

    "/api/epistolaries": {
      async GET(req) {
        return listEpistolaries(req, env);
      },
      async POST(req) {
        return createEpistolary(req, env);
      },
      async OPTIONS(req) {
        return new Response(null, {
          status: 204,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
          },
        });
      },
    },

    "/api/epistolaries/:id": {
      async GET(req) {
        return getEpistolary(req, env, req.params.id);
      },
      async PUT(req) {
        return updateEpistolary(req, env, req.params.id);
      },
      async DELETE(req) {
        return deleteEpistolary(req, env, req.params.id);
      },
      async OPTIONS(req) {
        return new Response(null, {
          status: 204,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
          },
        });
      },
    },

    "/api/epistolaries/:id/regenerate": {
      async POST(req) {
        return regenerateSecret(req, env, req.params.id);
      },
      async OPTIONS(req) {
        return new Response(null, {
          status: 204,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
          },
        });
      },
    },

    "/oauth/authorize": {
      async GET(req) {
        return authorize(req, env);
      },
      async POST(req) {
        return authorize(req, env);
      },
      async OPTIONS(req) {
        return new Response(null, {
          status: 204,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
          },
        });
      },
    },

    "/oauth/token": {
      async POST(req) {
        return token(req, env);
      },
      async OPTIONS(req) {
        return new Response(null, {
          status: 204,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
          },
        });
      },
    },

    "/oauth/userinfo": {
      async GET(req) {
        return userInfo(req, env);
      },
      async OPTIONS(req) {
        return new Response(null, {
          status: 204,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
          },
        });
      },
    },

    "/oauth/revoke": {
      async POST(req) {
        return revokeToken(req, env);
      },
      async OPTIONS(req) {
        return new Response(null, {
          status: 204,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
          },
        });
      },
    },
  },

  development: process.env.NODE_ENV !== "production" && {
    hmr: true,
    console: true,
  },
});

console.log(`✉️  Epístola Auth Server running at ${server.url}`);
