import axios from "axios";

export async function makeRequest({
  baseUrl,
  body,
  endpoint,
  method,
  queryString,
  headers,
  basicAuthUsername,
  basicAuthPassword
}) {
  // form url
  let url = `${baseUrl}${endpoint}`;
  if (queryString) {
    url = `${url}${queryString}`;
  }

  // form axios config obj
  const config = {
    method: method,
    url: url
  };
  if (basicAuthUsername && basicAuthPassword) {
    config["auth"] = {
      username: basicAuthUsername,
      password: basicAuthPassword
    };
  }
  if (headers) {
    config["headers"] = headers;
  }
  if(body){
    config["data"] = body;
  }

  // make call
  try {
    let res = await axios(config);
    console.log(config);
    return res;
  } catch (err) {
    throw new Error(err);
  }
}