# Finance Dashboard API Documentation

This guide provides a detailed overview of all backend endpoints available in the Finance Dashboard API, including how to authenticate, request formats, and expected responses.

## 🟢 Live Environment
You can test these endpoints against the live hosted service:
**Base URL:** `https://finance-dashboard-backend-8kix.onrender.com/api`

*(Note: Data is automatically reset periodically on the free tier, but seeded demo data is rebuilt upon server start. You can use `admin@finance.com` / `password123` to log in anytime).*

---

## 🔑 Authentication
The API uses JSON Web Tokens (JWT). All endpoints except `/auth/login` and `/auth/register` require an `Authorization` header.

**Header Format:**
```
Authorization: Bearer <your-jwt-token-here>
```

---

## 1. Auth Endpoints

### 1.1 Register User
Creates a new user. For security, all self-registered users are assigned the `VIEWER` role by default. Only an ADMIN can upgrade roles.
- **Method:** `POST`
- **Path:** `/auth/register`
- **Auth Required:** No
- **Body:**
  ```json
  {
    "email": "user@example.com",
    "password": "strongPassword123"
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "message": "User registered successfully",
    "userId": "uuid-string"
  }
  ```

### 1.2 Login
Authenticates a user and returns a token.
- **Method:** `POST`
- **Path:** `/auth/login`
- **Auth Required:** No
- **Body:**
  ```json
  {
    "email": "admin@finance.com",
    "password": "password123"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "role": "ADMIN",
    "userId": "uuid-string"
  }
  ```

### 1.3 Get Current Profile
Returns information about the currently authenticated user.
- **Method:** `GET`
- **Path:** `/auth/me`
- **Auth Required:** Yes (Any Role)
- **Response (200 OK):**
  ```json
  {
    "user": {
      "id": "uuid-string",
      "email": "admin@finance.com",
      "role": "ADMIN",
      "status": "ACTIVE",
      "createdAt": "2026-04-05T12:00:00Z"
    }
  }
  ```

---

## 2. Dashboard Analytics Endpoints

### 2.1 Get Summary
Returns high-level totals and category breakdowns.
- **Method:** `GET`
- **Path:** `/dashboard/summary`
- **Auth Required:** Yes (Any Role)
- **Response (200 OK):**
  ```json
  {
    "totalIncome": 25500,
    "totalExpenses": 5550,
    "netBalance": 19950,
    "recordCount": 14,
    "categoryBreakdown": [
      { "category": "Salary", "type": "INCOME", "total": 20000 }
    ]
  }
  ```

### 2.2 Get Monthly Trends
Returns month-by-month cashflow data for the last 6 months.
- **Method:** `GET`
- **Path:** `/dashboard/trends`
- **Auth Required:** Yes (Any Role)
- **Response (200 OK):**
  ```json
  {
    "trends": [
      {
        "month": "2026-01",
        "income": 5000,
        "expense": 1350,
        "net": 3650
      }
    ]
  }
  ```

### 2.3 Get Recent Activity
Returns the 10 most recent financial records.
- **Method:** `GET`
- **Path:** `/dashboard/recent`
- **Auth Required:** Yes (Any Role)
- **Response (200 OK):**
  ```json
  {
    "recentActivity": [
      {
        "id": "uuid",
        "amount": 250,
        "type": "EXPENSE",
        "category": "Groceries",
        "date": "2026-04-03T00:00:00.000Z",
        "notes": "Weekly groceries"
      }
    ]
  }
  ```

---

## 3. Financial Records Endpoints

### 3.1 List / Search Records
Full query functionality with pagination, filtering, and text search.
- **Method:** `GET`
- **Path:** `/records`
- **Auth Required:** Yes (`ADMIN` or `ANALYST` only)
- **Query Parameters (Optional):**
  - `page`: default 1
  - `limit`: default 20 (max 100)
  - `type`: `INCOME` or `EXPENSE`
  - `category`: Exact match category name
  - `startDate`, `endDate`: ISO format dates
  - `search`: Keyword to search in `category` or `notes`
- **Example Usage:** `/records?page=1&type=EXPENSE&search=grocery`

### 3.2 Create Record
- **Method:** `POST`
- **Path:** `/records`
- **Auth Required:** Yes (`ADMIN` only)
- **Body:**
  ```json
  {
    "amount": 100,
    "type": "EXPENSE",
    "category": "Groceries",
    "date": "2026-05-12T00:00:00Z",
    "notes": "Costco run"
  }
  ```

### 3.3 Update Record
Updates specific fields of an existing record.
- **Method:** `PATCH`
- **Path:** `/records/:id`
- **Auth Required:** Yes (`ADMIN` only)
- **Body:** Provide only the fields you wish to update. Example:
  ```json
  { "amount": 150 }
  ```

### 3.4 Soft-Delete Record
Marks a record as deleted so it is removed from dashboards without destroying data.
- **Method:** `DELETE`
- **Path:** `/records/:id`
- **Auth Required:** Yes (`ADMIN` only)

---

## 4. User Management Endpoints (ADMIN Only)

### 4.1 List Users
- **Method:** `GET`
- **Path:** `/users`
- **Auth Required:** Yes (`ADMIN` only)

### 4.2 Restrict / Escalate Roles
Used to upgrade a user to `ANALYST` or `ADMIN`, or to suspend accounts.
- **Method:** `PATCH`
- **Path:** `/users/:id`
- **Auth Required:** Yes (`ADMIN` only)
- **Body Options:**
  - `role`: "VIEWER", "ANALYST", "ADMIN"
  - `status`: "ACTIVE", "INACTIVE"
- **Example Body:**
  ```json
  {
    "role": "ANALYST",
    "status": "ACTIVE"
  }
  ```

---

## 🛠️ How to Test Using Postman

1. **Login First:**
   - Create a request to `POST https://finance-dashboard-backend-8kix.onrender.com/api/auth/login`.
   - Go to the **Body** tab, select **Raw**, and choose **JSON**.
   - Input the admin credentials and click Send.
   
2. **Setup Authorization:**
   - Copy the `"token"` value from the response.
   - For any other request (e.g., Dashboard Summary), go to your request's **Authorization** tab.
   - Select **Bearer Token**.
   - Paste the token into the Token field.

3. **Explore!**
   - Click Send and you will see secure data from the live database.
