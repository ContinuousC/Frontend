/******************************************************************************
 * Copyright ContinuousC. Licensed under the "Elastic License 2.0".           *
 ******************************************************************************/

import axios from "axios";
import { paths as rgPaths } from './types/relation-graph-api';

type MaybeIndex<T, K extends string | number, D = never> = T extends never ? T : K extends keyof T ? T[K] : D;

type Path<Api, P extends string, M extends string> = P extends keyof Api ? M extends keyof Api[P] ? P : never : never;

type PathParams<Api, P extends string, M extends string> = IsPathParams<MaybeIndex<MaybeIndex<MaybeIndex<MaybeIndex<Api, P>, M>, "parameters">, "path">>;
type IsPathParams<T> = T extends { [field: string]: string | string[] } ? T : undefined;

type Body<Api, P extends string, M extends string> = MaybeIndex<MaybeIndex<MaybeIndex<MaybeIndex<MaybeIndex<Api, P>, M>, "requestBody", undefined>, "content", undefined>, "application/json", undefined>;
type Response<Api, P extends string, M extends string> = MaybeIndex<MaybeIndex<MaybeIndex<MaybeIndex<MaybeIndex<MaybeIndex<Api, P>, M>, "responses">, 200>, "content">, "application/json">;

type OmitUndefined<T> = [{ [Key in keyof T as undefined extends T[Key] ? never : Key]: T[Key] }
  & { [Key in keyof T as undefined extends T[Key] ? Key : never]?: T[Key] }]
  | ({ [Key in keyof T]: undefined } extends T ? [] : never);


function getUrl(path: string, pathParams: { [field: string]: string | string[] }): string {
  return path.replace(/\{(\w+)(?::([^}]|\\.)*)?\}/g,
    (_, m) => {
      const value = m in pathParams ? pathParams[m] : "";
      return value instanceof Array
        ? value.map(elem => "/" + encodeURIComponent(elem)).join("")
        : encodeURIComponent(value)
    });
}

function apiClient<Api>() {
  return {
    get: async function <P extends string>(path: Path<Api, P, "get">, ...options: OmitUndefined<{
      path: PathParams<Api, P, "get">
    }>): Promise<Response<Api, P, "get">> {
      const opts = options.length > 0 ? options[0] || {} : {};
      const pathParams = ("path" in opts ? opts.path || {} : {}) as { [key: string]: string };
      const res = await axios.get(getUrl(path, pathParams));
      return res.data;
    },
    post: async function <P extends string>(path: Path<Api, P, "post">, ...options: OmitUndefined<{
      path: PathParams<Api, P, "post">,
      body: Body<Api, P, "post">
    }>): Promise<Response<Api, P, "post">> {
      const opts = options.length > 0 ? options[0] || {} : {};
      const pathParams = ("path" in opts ? opts.path || {} : {}) as { [key: string]: string };
      const body = ("body" in opts ? opts.body : undefined) as any;
      const res = await axios.post(getUrl(path, pathParams), body);
      return res.data;
    },
    put: async function <P extends string>(path: Path<Api, P, "put">, ...options: OmitUndefined<{
      path: PathParams<Api, P, "put">,
      body: Body<Api, P, "put">
    }>): Promise<Response<Api, P, "put">> {
      const opts = options.length > 0 ? options[0] || {} : {};
      const pathParams = ("path" in opts ? opts.path || {} : {}) as { [key: string]: string };
      const body = ("body" in opts ? opts.body : undefined) as any;
      const res = await axios.put(getUrl(path, pathParams), body);
      return res.data;
    },
    delete: async function <P extends string>(path: Path<Api, P, "delete">, ...options: OmitUndefined<{
      path: PathParams<Api, P, "delete">,
      body: Body<Api, P, "delete">
    }>): Promise<Response<Api, P, "delete">> {
      const opts = options.length > 0 ? options[0] || {} : {};
      const pathParams = ("path" in opts ? opts.path || {} : {}) as { [key: string]: string };
      const body = ("body" in opts ? opts.body : undefined) as any;
      const res = await axios.delete(getUrl(path, pathParams), { data: body });
      return res.data;
    },
  };
}

export const rg = apiClient<rgPaths>();
