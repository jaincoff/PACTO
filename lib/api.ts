export interface LoginResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    status: string;
    created_at: string;
  };
}

export interface RegisterUserInput {
  name: string;
  email: string;
  password: string;
  role: "volunteer" | "supervisor";
  birth_year?: number | null;
  phone?: string | null;
  gender?: string | null;
}

export interface RegisterUserResponse {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  message: string;
}

export interface ElderRegisterInput {
  email?: string;
  phone?: string;
  password: string;
}

export interface ElderRegisterResponse {
  id: string;
  email: string | null;
  role: string;
  status: string;
  message: string;
}

export interface LandingMetrics {
  active_volunteers: number;
  active_supervisors: number;
  elders_supported: number;
}

export interface DashboardOverview {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    status: string;
  };
  stats: Record<string, number | string | boolean | null>;
}

export interface SupervisorDashboardResponse {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    status: string;
  };
  kpis: {
    active_volunteers: number;
    pending_volunteers: number;
    elders_total: number;
    elders_in_progress: number;
  };
  volunteers: Array<{
    id: string;
    email: string;
    status: string;
    assigned_elders: number;
    created_at: string;
  }>;
  elders: Array<{
    id: string;
    name: string;
    age: number | null;
    status: string;
    wellbeing_summary: string | null;
    updated_at: string;
  }>;
}

export interface ElderCreateInput {
  name: string;
  age?: number;
  phone?: string;
  email?: string;
  address?: string;
  emergency_contact?: string;
}

export interface ElderCreateResponse {
  elder_id: string;
  session_id: string;
  status: string;
  message: string;
}

export interface ElderListItem {
  id: string;
  name: string;
  age: number | null;
  phone: string | null;
  email: string | null;
  status: string;
  total_score: number | null;
  wellbeing_summary: string | null;
  photo: string | null;
  in_case: boolean;
  created_at: string;
}

export interface ElderAnswerDetail {
  question_id: number;
  question_text: string;
  chosen_option: string;
  points: number;
  category: string | null;
}

export interface ElderDetail {
  id: string;
  name: string;
  age: number | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  emergency_contact: string | null;
  status: string;
  total_score: number | null;
  wellbeing_summary: string | null;
  photo: string | null;
  answers: ElderAnswerDetail[];
  created_at: string;
  updated_at: string;
}

export interface AdminUserListItem {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  created_at: string;
  test_score?: number | null;
  test_passed?: boolean | null;
}

export interface MyElderProfile {
  id: string;
  name: string;
  age: number | null;
  phone: string | null;
  email: string | null;
  status: string;
  wellbeing_summary: string | null;
}

export interface CurrentUserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  birth_year: number | null;
  phone: string | null;
  gender: string | null;
  photo: string | null;
  created_at: string;
  updated_at: string;
}

export interface SkillTestQuestion {
  id: number;
  question_text: string;
  options: Array<{
    text: string;
    points: number;
  }>;
  order: number;
  category: string | null;
}

export interface SkillTestCategory {
  key: string;
  label: string;
  questions: SkillTestQuestion[];
}

export interface SkillTestGroupedResponse {
  categories: SkillTestCategory[];
  total_questions: number;
}

export interface SkillTestResult {
  attempt_id: string;
  score: number;
  max_score: number;
  passed: boolean;
  passing_score: number;
  new_status: string;
  message: string;
}

export interface TestProgressCategory {
  key: string;
  label: string;
  status: string;
  total_questions: number;
  answered_count: number;
  answers: Record<string, number>;
  score: number | null;
  max_score: number | null;
  percentage: number | null;
  level: string | null;
  interpretation: string | null;
}

export interface TestProgressResponse {
  attempt_id: string | null;
  categories: TestProgressCategory[];
  current_category: string | null;
  total_progress: number;
}

export interface SaveProgressRequest {
  category: string;
  answers: Record<string, number>;
}


function getApiBaseUrl() {
  const raw = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (raw) {
    return raw.endsWith("/") ? raw.slice(0, -1) : raw;
  }
  // When shared via ngrok (no custom API URL set), use relative path
  // so requests go to the same origin the frontend is served from.
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host === "localhost" || host === "127.0.0.1") {
      return "http://localhost:8000/api/v1";
    }
    return "/api/v1";
  }
  return "http://localhost:8000/api/v1";
}

async function parseJsonOrThrow(response: Response) {
  if (response.status === 401 || response.status === 403) {
    clearAuthSession();
    if (typeof window !== "undefined") {
      window.location.replace("/");
    }
    // Return a never-resolving promise to stop further processing
    return new Promise(() => {});
  }

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const detail =
      typeof payload?.detail === "string"
        ? payload.detail
        : "Request failed. Please try again.";
    throw new Error(detail);
  }

  return payload;
}

export async function loginRequest(
  email: string,
  password: string,
): Promise<LoginResponse> {
  const response = await fetch(`${getApiBaseUrl()}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  // Don't use parseJsonOrThrow — login errors should show on page, not redirect
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(
      typeof payload?.detail === "string"
        ? payload.detail
        : "Email ou palavra-passe incorretos.",
    );
  }
  return payload;
}

export async function registerUserRequest(
  payload: RegisterUserInput,
): Promise<RegisterUserResponse> {
  const response = await fetch(`${getApiBaseUrl()}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  return parseJsonOrThrow(response);
}

export async function elderRegisterRequest(
  payload: ElderRegisterInput,
): Promise<ElderRegisterResponse> {
  const response = await fetch(`${getApiBaseUrl()}/auth/elder-register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  return parseJsonOrThrow(response);
}

export async function getLandingMetrics(): Promise<LandingMetrics> {
  const response = await fetch(`${getApiBaseUrl()}/public/landing`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });

  return parseJsonOrThrow(response);
}

export async function getDashboardOverview(
  token: string,
): Promise<DashboardOverview> {
  const response = await fetch(`${getApiBaseUrl()}/users/dashboard`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  return parseJsonOrThrow(response);
}

export async function getSupervisorDashboard(
  token: string,
): Promise<SupervisorDashboardResponse> {
  const response = await fetch(`${getApiBaseUrl()}/users/supervisor/painel`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  return parseJsonOrThrow(response);
}

export async function createElder(
  token: string,
  payload: ElderCreateInput,
): Promise<ElderCreateResponse> {
  const response = await fetch(`${getApiBaseUrl()}/elders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  return parseJsonOrThrow(response);
}

export async function listMyElders(token: string): Promise<ElderListItem[]> {
  const response = await fetch(`${getApiBaseUrl()}/elders`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  return parseJsonOrThrow(response);
}

export async function getElderDetail(
  token: string,
  elderId: string,
): Promise<ElderDetail> {
  const response = await fetch(`${getApiBaseUrl()}/elders/${elderId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  return parseJsonOrThrow(response);
}

export async function listUsersAdmin(
  token: string,
  limit = 20,
  filters?: { role?: string; status?: string; search?: string },
): Promise<AdminUserListItem[]> {
  const params = new URLSearchParams();
  params.set("limit", String(limit));
  if (filters?.role) params.set("role", filters.role);
  if (filters?.status) params.set("status", filters.status);
  if (filters?.search) params.set("search", filters.search);

  const response = await fetch(
    `${getApiBaseUrl()}/users?${params.toString()}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    },
  );

  return parseJsonOrThrow(response);
}

export async function getMyElderProfile(
  token: string,
): Promise<MyElderProfile> {
  const response = await fetch(`${getApiBaseUrl()}/elders/me`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  return parseJsonOrThrow(response);
}

export async function getCurrentUserProfile(
  token: string,
): Promise<CurrentUserProfile> {
  const response = await fetch(`${getApiBaseUrl()}/users/me`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  return parseJsonOrThrow(response);
}

export async function getSkillTestQuestions(
  token: string,
  role: "volunteer" | "supervisor",
): Promise<SkillTestGroupedResponse> {
  const response = await fetch(`${getApiBaseUrl()}/tests/${role}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  return parseJsonOrThrow(response);
}

export async function submitSkillTest(
  token: string,
  role: "volunteer" | "supervisor",
  answers: Array<{ question_id: number; chosen_option_index: number }>,
): Promise<SkillTestResult> {
  const response = await fetch(`${getApiBaseUrl()}/tests/${role}/submit`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ answers }),
  });

  return parseJsonOrThrow(response);
}

export async function getTestProgress(
  token: string,
  role: "volunteer" | "supervisor",
): Promise<TestProgressResponse> {
  const response = await fetch(`${getApiBaseUrl()}/tests/${role}/progress`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  return parseJsonOrThrow(response);
}

export async function saveTestProgress(
  token: string,
  role: "volunteer" | "supervisor",
  data: SaveProgressRequest,
): Promise<TestProgressResponse> {
  const response = await fetch(`${getApiBaseUrl()}/tests/${role}/progress`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  return parseJsonOrThrow(response);
}

// ── Approval / Supervisor ────────────────────────────────────────────

export interface PendingVolunteer {
  id: string;
  name: string;
  email: string;
  status: string;
  created_at: string;
  test_score: number | null;
  test_passed: boolean | null;
  test_attempt_id: string | null;
  total_questions: number | null;
}

export interface TestAnswerDetail {
  question_id: number;
  question_text: string;
  chosen_option_index: number;
  chosen_text: string;
  points: number;
  max_points: number;
}

export interface VolunteerTestDetail {
  attempt_id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  test_role: string;
  score: number;
  max_score: number;
  passed: boolean;
  passing_score: number;
  answers: TestAnswerDetail[];
  created_at: string;
}

export interface ApproveUserResponse {
  user_id: string;
  approved_by: string | null;
  new_status: string;
  message: string;
}

export interface ProfileUpdateRequest {
  name?: string;
  email?: string;
  phone?: string;
  birth_year?: number;
  gender?: string;
}

export async function listPendingVolunteers(
  token: string,
): Promise<PendingVolunteer[]> {
  const response = await fetch(
    `${getApiBaseUrl()}/users/pending-approval?role=volunteer`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    },
  );
  return parseJsonOrThrow(response);
}

export async function getVolunteerTestDetail(
  token: string,
  userId: string,
): Promise<VolunteerTestDetail> {
  const response = await fetch(
    `${getApiBaseUrl()}/users/${userId}/test-detail`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    },
  );
  return parseJsonOrThrow(response);
}

export async function approveVolunteer(
  token: string,
  userId: string,
): Promise<ApproveUserResponse> {
  const response = await fetch(
    `${getApiBaseUrl()}/users/${userId}/approve`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    },
  );
  return parseJsonOrThrow(response);
}

export async function updateMyProfile(
  token: string,
  data: ProfileUpdateRequest,
): Promise<CurrentUserProfile> {
  const response = await fetch(`${getApiBaseUrl()}/users/me`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  return parseJsonOrThrow(response);
}

// ── Assessment Results ─────────────────────────────────────────────

export interface AssessmentDimension {
  label: string;
  average: number;
  total: number;
}

export interface AssessmentCategoryResult {
  score: number;
  max: number;
  percentage: number;
  label: string;
  level: string;
  interpretation: string;
  dimensions?: Record<string, AssessmentDimension>;
}

export interface AssessmentResultsResponse {
  results: Record<string, AssessmentCategoryResult> | null;
  message?: string;
}

export async function getMyAssessmentResults(
  token: string,
): Promise<AssessmentResultsResponse> {
  const response = await fetch(
    `${getApiBaseUrl()}/users/me/assessment-results`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    },
  );
  return parseJsonOrThrow(response);
}

// ── Supervisor Volunteer Management ─────────────────────────────────

export interface VolunteerWithElders {
  id: string;
  name: string;
  email: string;
  status: string;
  elders_count: number;
  elders: Array<{ id: string; name: string; status: string; age: number | null }>;
}

export interface SupervisorVolunteersResponse {
  volunteers: VolunteerWithElders[];
}

export async function listVolunteersWithElders(
  token: string,
): Promise<SupervisorVolunteersResponse> {
  const response = await fetch(
    `${getApiBaseUrl()}/admin/supervisor/volunteers-with-elders`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    },
  );
  return parseJsonOrThrow(response);
}

export async function getVolunteerAssessmentResults(
  token: string,
  userId: string,
): Promise<AssessmentResultsResponse> {
  const response = await fetch(
    `${getApiBaseUrl()}/admin/users/${userId}/assessment-results`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    },
  );
  return parseJsonOrThrow(response);
}

export async function listAvailableElders(
  token: string,
): Promise<ElderListItem[]> {
  const response = await fetch(`${getApiBaseUrl()}/elders/available`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  return parseJsonOrThrow(response);
}

export async function listAllElders(
  token: string,
  withoutCase?: boolean,
): Promise<ElderListItem[]> {
  const params = withoutCase ? "?without_case=true" : "";
  const response = await fetch(`${getApiBaseUrl()}/elders/all${params}`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  return parseJsonOrThrow(response);
}

export async function listAllVolunteers(
  token: string,
): Promise<AdminUserListItem[]> {
  const response = await fetch(`${getApiBaseUrl()}/users/volunteers/list`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  return parseJsonOrThrow(response);
}

// ── Elder Assessment ────────────────────────────────────────────────

export interface ElderAssessmentResultsResponse {
  elder_id: string;
  elder_name: string;
  results: Record<string, AssessmentCategoryResult> | null;
  message?: string;
}

export async function getElderAssessmentResults(
  token: string,
  elderId: string,
): Promise<ElderAssessmentResultsResponse> {
  const response = await fetch(
    `${getApiBaseUrl()}/elders/${elderId}/assessment-results`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    },
  );
  return parseJsonOrThrow(response);
}

// ── Admin ──────────────────────────────────────────────────────────

export async function listPendingSupervisors(
  token: string,
): Promise<PendingVolunteer[]> {
  const response = await fetch(
    `${getApiBaseUrl()}/users/pending-approval?role=supervisor`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    },
  );
  return parseJsonOrThrow(response);
}

export async function changeUserStatus(
  token: string,
  userId: string,
  newStatus: string,
): Promise<{ user_id: string; new_status: string; message: string }> {
  const response = await fetch(`${getApiBaseUrl()}/users/${userId}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ status: newStatus }),
  });
  return parseJsonOrThrow(response);
}

export async function deleteUser(
  token: string,
  userId: string,
): Promise<{ user_id: string; message: string }> {
  const response = await fetch(`${getApiBaseUrl()}/users/${userId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return parseJsonOrThrow(response);
}

// ── Admin: Assessment Management ─────────────────────────────────────

export interface AdminTestQuestion {
  id: number;
  question_text: string;
  options: Array<{ text: string; points: number }>;
  order: number;
  category: string | null;
  role: string;
}

export interface AdminAssessmentQuestion {
  id: number;
  question_text: string;
  options: Array<{ text: string; points: number }>;
  order: number;
  category: string | null;
}

export async function listAdminTestQuestions(
  token: string,
  role?: "volunteer" | "supervisor",
): Promise<AdminTestQuestion[]> {
  const params = role ? `?role=${role}` : "";
  const response = await fetch(
    `${getApiBaseUrl()}/admin/test-questions${params}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    },
  );
  return parseJsonOrThrow(response);
}

export async function createTestQuestion(
  token: string,
  data: {
    role: string;
    question_text: string;
    options: Array<{ text: string; points: number }>;
    order: number;
    category?: string;
  },
): Promise<AdminTestQuestion> {
  const response = await fetch(`${getApiBaseUrl()}/admin/test-questions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  return parseJsonOrThrow(response);
}

export async function updateTestQuestion(
  token: string,
  questionId: number,
  data: {
    question_text?: string;
    options?: Array<{ text: string; points: number }>;
    order?: number;
    category?: string;
  },
): Promise<AdminTestQuestion> {
  const response = await fetch(
    `${getApiBaseUrl()}/admin/test-questions/${questionId}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    },
  );
  return parseJsonOrThrow(response);
}

export async function deleteTestQuestion(
  token: string,
  questionId: number,
): Promise<{ question_id: number; message: string }> {
  const response = await fetch(
    `${getApiBaseUrl()}/admin/test-questions/${questionId}`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    },
  );
  return parseJsonOrThrow(response);
}

export async function listAdminAssessmentQuestions(
  token: string,
): Promise<AdminAssessmentQuestion[]> {
  const response = await fetch(
    `${getApiBaseUrl()}/admin/assessment-questions`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    },
  );
  return parseJsonOrThrow(response);
}

export async function createAssessmentQuestion(
  token: string,
  data: {
    question_text: string;
    options: Array<{ text: string; points: number }>;
    order: number;
    category?: string;
  },
): Promise<AdminAssessmentQuestion> {
  const response = await fetch(
    `${getApiBaseUrl()}/admin/assessment-questions`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    },
  );
  return parseJsonOrThrow(response);
}

export async function updateAssessmentQuestion(
  token: string,
  questionId: number,
  data: {
    question_text?: string;
    options?: Array<{ text: string; points: number }>;
    order?: number;
    category?: string;
  },
): Promise<AdminAssessmentQuestion> {
  const response = await fetch(
    `${getApiBaseUrl()}/admin/assessment-questions/${questionId}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    },
  );
  return parseJsonOrThrow(response);
}

export async function deleteAssessmentQuestion(
  token: string,
  questionId: number,
): Promise<{ question_id: number; message: string }> {
  const response = await fetch(
    `${getApiBaseUrl()}/admin/assessment-questions/${questionId}`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    },
  );
  return parseJsonOrThrow(response);
}

export function persistAuthSession(
  payload: LoginResponse,
  rememberMe: boolean,
) {
  if (typeof window === "undefined") return;

  clearAuthSession();

  localStorage.setItem("auth_token", payload.access_token);
  localStorage.setItem("auth_user", JSON.stringify(payload.user));

  // Also set as cookie so middleware and backend can read it
  const maxAge = rememberMe ? 60 * 60 * 24 * 30 : undefined; // 30 days if remember
  document.cookie = `access_token=${payload.access_token}; path=/; SameSite=Lax${maxAge ? `; max-age=${maxAge}` : ""}`;

  if (rememberMe) {
    localStorage.setItem("remember_me", "true");
  } else {
    localStorage.removeItem("remember_me");
  }
}

export function getStoredAuthToken() {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem("auth_token");
  if (stored) return stored;
  const match = document.cookie.match(/(?:^|;\s*)access_token=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

export function getStoredAuthUser(): LoginResponse["user"] | null {
  if (typeof window === "undefined") return null;

  const raw = localStorage.getItem("auth_user");
  if (!raw) return null;

  try {
    return JSON.parse(raw) as LoginResponse["user"];
  } catch {
    return null;
  }
}

// ── Forgot / Reset Password ────────────────────────────────────────

export interface ForgotPasswordRequest {
  email?: string;
  phone?: string;
}

export interface ForgotPasswordResponse {
  message: string;
  via: "email" | "phone";
  masked_contact: string;
}

export interface VerifyResetCodeRequest {
  email?: string;
  phone?: string;
  code: string;
}

export interface VerifyResetCodeResponse {
  reset_token: string;
  message: string;
}

export interface ResetPasswordRequest {
  reset_token: string;
  new_password: string;
}

export interface ResetPasswordResponse {
  message: string;
}

export async function forgotPasswordRequest(
  payload: ForgotPasswordRequest,
): Promise<ForgotPasswordResponse> {
  const response = await fetch(`${getApiBaseUrl()}/auth/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(
      typeof data?.detail === "string"
        ? data.detail
        : "Erro ao solicitar redefinicao da palavra-passe.",
    );
  }
  return data;
}

export async function verifyResetCodeRequest(
  payload: VerifyResetCodeRequest,
): Promise<VerifyResetCodeResponse> {
  const response = await fetch(`${getApiBaseUrl()}/auth/verify-reset-code`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(
      typeof data?.detail === "string"
        ? data.detail
        : "Codigo invalido ou expirado.",
    );
  }
  return data;
}

export async function resetPasswordRequest(
  payload: ResetPasswordRequest,
): Promise<ResetPasswordResponse> {
  const response = await fetch(`${getApiBaseUrl()}/auth/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(
      typeof data?.detail === "string"
        ? data.detail
        : "Erro ao redefinir a palavra-passe.",
    );
  }
  return data;
}

// ── Profile Photo ───────────────────────────────────────────────────

export function getProfilePhotoUrl(photo: string | null | undefined): string | null {
  if (!photo) return null;
  if (photo.startsWith("http")) return photo;
  return `${getApiBaseUrl()}/users/me/photo/file/${photo}`;
}

export async function uploadProfilePhoto(
  token: string,
  file: File,
): Promise<{ photo: string; message: string }> {
  const formData = new FormData();
  formData.append("file", file);
  const response = await fetch(`${getApiBaseUrl()}/users/me/photo`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  return parseJsonOrThrow(response);
}

export async function deleteProfilePhoto(
  token: string,
): Promise<{ message: string }> {
  const response = await fetch(`${getApiBaseUrl()}/users/me/photo`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  return parseJsonOrThrow(response);
}

// ── Elder Cases (Volunteer Assignments) ──────────────────────────────

export interface AssessmentProgressInfo {
  status: string;
  total_questions: number;
  answered_questions: number;
  total_score: number | null;
  wellbeing_summary: string | null;
  results: Record<string, {
    score: number;
    max: number;
    percentage: number;
    label: string;
    level: string;
    interpretation: string;
  }> | null;
}

export interface CaseVolunteerInfo {
  id: string;
  name: string;
  email: string;
  status: string | null;
}

export interface ElderCaseOut {
  id: string;
  case_name: string;
  elder_id: string;
  elder_name: string;
  volunteer1_id: string;
  volunteer1_name: string;
  volunteer2_id: string | null;
  volunteer2_name: string | null;
  supervisor_id: string;
  supervisor_name: string;
  status: string;
  created_at: string;
  updated_at: string;
  assessment_progress: AssessmentProgressInfo | null;
}

export interface ElderCaseDetail {
  id: string;
  case_name: string;
  status: string;
  elder: ElderDetail | null;
  volunteer1: CaseVolunteerInfo | null;
  volunteer2: CaseVolunteerInfo | null;
  supervisor: CaseVolunteerInfo | null;
  created_at: string;
  updated_at: string;
  assessment_progress: AssessmentProgressInfo | null;
}

export interface CaseCreateRequest {
  case_name: string;
  elder_id: string;
  volunteer1_id: string;
  volunteer2_id?: string | null;
}

export interface CaseUpdateRequest {
  case_name?: string;
  volunteer1_id?: string;
  volunteer2_id?: string | null;
}

// ── Admin/Supervisor Case Endpoints ──────────────────────────────────

export async function listCases(token: string): Promise<ElderCaseOut[]> {
  const response = await fetch(`/api/v1/admin/cases`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  console.log("------- >listCases response:", response);
  return parseJsonOrThrow(response);
}

export async function createCase(
  token: string,
  data: CaseCreateRequest,
): Promise<ElderCaseOut> {
  const response = await fetch(`/api/v1/admin/cases`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  return parseJsonOrThrow(response);
}

export async function getCaseDetail(
  token: string,
  caseId: string,
): Promise<ElderCaseDetail> {
  const response = await fetch(`/api/v1/admin/cases/${caseId}`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  return parseJsonOrThrow(response);
}

export async function updateCase(
  token: string,
  caseId: string,
  data: CaseUpdateRequest,
): Promise<ElderCaseOut> {
  const response = await fetch(`/api/v1/admin/cases/${caseId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  return parseJsonOrThrow(response);
}

export async function deleteCase(
  token: string,
  caseId: string,
): Promise<{ case_id: string; message: string }> {
  const response = await fetch(`/api/v1/admin/cases/${caseId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  return parseJsonOrThrow(response);
}

// ── Volunteer Case Endpoints ─────────────────────────────────────────

export async function listMyCases(token: string): Promise<ElderCaseOut[]> {
  const response = await fetch(`/api/v1/elders/cases`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  return parseJsonOrThrow(response);
}

export async function getMyCaseDetail(
  token: string,
  caseId: string,
): Promise<ElderCaseDetail> {
  const response = await fetch(`/api/v1/elders/cases/${caseId}`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  return parseJsonOrThrow(response);
}

export function clearAuthSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("auth_token");
  localStorage.removeItem("auth_user");
  localStorage.removeItem("remember_me");
  document.cookie = "access_token=; path=/; max-age=0";
}

export function getDashboardRouteForRole(role: string) {
  switch (role) {
    case "admin":
      return "/admin/painel";
    case "elder":
      return "/idoso/painel";
    case "supervisor":
    case "superuser":
      return "/supervisor/painel";
    case "volunteer":
    default:
      return "/voluntario/painel";
  }
}

// ── Elder Photo ─────────────────────────────────────────────────────

export function getElderPhotoUrl(elderId: string, photo: string | null | undefined): string | null {
  if (!photo) return null;
  if (photo.startsWith("http")) return photo;
  return `${getApiBaseUrl()}/elders/${elderId}/photo/file/${photo}`;
}

export async function uploadElderPhoto(
  token: string,
  elderId: string,
  file: File,
): Promise<{ photo: string; message: string }> {
  const formData = new FormData();
  formData.append("file", file);
  const response = await fetch(`${getApiBaseUrl()}/elders/${elderId}/photo`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  return parseJsonOrThrow(response);
}

export async function deleteElderPhoto(
  token: string,
  elderId: string,
): Promise<{ message: string }> {
  const response = await fetch(`${getApiBaseUrl()}/elders/${elderId}/photo`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  return parseJsonOrThrow(response);
}

// ── User Detail by ID ──────────────────────────────────────────────────

export interface UserDetailResponse {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  phone: string | null;
  birth_year: number | null;
  gender: string | null;
  photo: string | null;
  created_at: string;
  updated_at: string;
  test_attempts: Array<{
    id: string;
    test_role: string;
    score: number;
    passed: boolean;
    created_at: string;
  }>;
}

export async function getUserById(
  token: string,
  userId: string,
): Promise<UserDetailResponse> {
  const response = await fetch(`${getApiBaseUrl()}/users/${userId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });
  return parseJsonOrThrow(response);
}

export interface BasicUserInfo {
  id: string;
  name: string;
  email: string;
  phone: string | null;
}

export async function getUserBasicInfo(
  token: string,
  userId: string,
): Promise<BasicUserInfo> {
  const response = await fetch(`${getApiBaseUrl()}/users/${userId}/basic`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  return parseJsonOrThrow(response);
}
