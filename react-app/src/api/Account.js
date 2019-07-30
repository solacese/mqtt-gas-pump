import { makeRequest } from "./HttpClient";
import { ApiConfig } from "./ApiConfig";

const apiBaseUrl = `http://${ApiConfig["hostUrl"]}:${ApiConfig["port"]}`;

export async function createAccount(firstName, lastName, email) {
  const reqBody = {
    firstName: firstName,
    lastName: lastName,
    email: email
  };
  const reqParams = {
    baseUrl: apiBaseUrl,
    body: reqBody,
    endpoint: "/account",
    method: "POST"
  };
  try {
    let res = await makeRequest(reqParams);
    return res.data;
  } catch (err) {
    throw new Error(err);
  }
}

let res = await createAccount();
console.log(res);
