import http from "k6/http";
import { check } from "k6";

export const options = {
  vus: 50,
  duration: "10s"
};

export default function () {
  const email = `user_${__VU}_${__ITER}@test.com`;
console.log(email)
  const payload = JSON.stringify({
    name: "Rahul",
    email: email,
    password: "123456",
    role: "admin"

  });

  const headers = {
    "Content-Type": "application/json"
  };

  const res = http.post(
    "http://localhost:3000/api/auth/register",
    payload,
    { headers }
  );

  check(res, {
    "status is 201 or 409": r =>
      r.status === 201 || r.status === 409
  });
}
