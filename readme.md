# HttpService Builder

This library provides a simple and type-safe way to make HTTP requests using Axios. It includes an `HttpService` class for basic requests and a fluent `RequestBuilder` class for more complex scenarios with callbacks and request lifecycle management.

## Installation

```bash
$ npm install @kozmonot/http-builder 
```

```bash
$ yarn add @kozmonot/http-builder 
```

## Usage

### HttpService

The `HttpService` class is a wrapper around Axios with pre-configured defaults for JSON requests and error handling.

```typescript
import { HttpService, RequestBuilder } from './http-service';

interface Post {
    id: number;
    title: string;
    body: string;
}

interface CreatePostPayload {
    title: string;
    body: string;
}

async function createNewPost(payload: CreatePostPayload): Promise<Post | undefined> {
    try {
        const newPost = await HttpService.builder<CreatePostPayload, Post>()
            .setUrl('/api/posts')
            .setMethod('POST')
            .setData(payload)
            .onLoading((loading) => {
                console.log('Creating post:', loading);
            })
            .onCompleted((response) => {
                console.log('Post created successfully:', response);
            })
            .onError((error) => {
                console.error('Failed to create post:', error);
            })
            .send();
        return newPost;
    } catch (error) {
        // Error is already handled in onError callback
        return undefined;
    }
}

createNewPost({ title: 'My New Post', body: 'This is the content of my new post.' });

// Example with aborting a request:
const request = HttpService.builder<undefined, Post[]>()
    .setUrl('/api/posts')
    .setMethod('GET')
    .onLoading((loading) => console.log('Fetching posts:', loading))
    .onCompleted((posts) => console.log('Posts:', posts))
    .onError((error) => console.error('Error fetching posts:', error))
    .send();

// To abort the request (e.g., after a timeout or user action):
// setTimeout(() => {
//   (request as any).abort(); // Accessing the underlying RequestBuilder instance
//   console.log('Request aborted.');
// }, 500);
```

## API Reference

### `HttpService` Class

#### `constructor()`

Initializes a new `HttpService` instance with default headers (`Accept: application/json`, `Content-Type: application/json; charset=UTF-8`), disables credentials, and enables XSRF token handling. It also sets up a response interceptor to directly return the response data and handle errors.

#### `request<T, R>(config: AxiosRequestConfig<T>, customHeaders?: Record<string, string>, responseType: ResponseType = "json"): Promise<R>`

Makes an HTTP request with the given configuration.

-   `config`: Axios request configuration object.
-   `customHeaders` (optional): An object of custom headers to merge with the default and request-specific headers.
-   `responseType` (optional): The expected response type (default: `"json"`).

Returns a `Promise` that resolves with the response data of type `R` or rejects with an `IApiErrorModel` on error.

#### `builder<T, R>()`

A static method that returns a new instance of the `RequestBuilder` class, allowing for a fluent request construction.

-   `T`: The type of the request body data.
-   `R`: The expected type of the response data.

### `builder<T, R>` Class

Provides a fluent interface for building and sending HTTP requests.

#### `setUrl(url: string): this`

Sets the URL for the request.

#### `setMethod(method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE"): this`

Sets the HTTP method for the request.

#### `setData(data: T): this`

Sets the request body data.

#### `setParams(params: Record<string, any>): this`

Sets the URL query parameters.

#### `setHeaders(headers: Record<string, string>): this`

Sets custom headers for the request.

#### `setConfig(config: AxiosRequestConfig<any>): this`

Sets additional Axios request configuration options.

#### `setResponseType(responseType: ResponseType): this`

Sets the expected response type.

#### `onCompleted(callback: (response: R) => void): this`

Sets a callback function to be executed when the request is successful and the data is received. The callback receives the response data of type `R`.

#### `onError(callback: (error: any) => void): this`

Sets a callback function to be executed when the request fails. The callback receives the error object.

#### `onLoading(callback: (loading: boolean) => void): this`

Sets a callback function that is called with `true` when the request starts and `false` when it completes (either successfully or with an error).

#### `onProgress(callback: (progressEvent: AxiosProgressEvent) => void): this`

Sets a callback function that is called during the request progress (both upload and download). The callback receives an `AxiosProgressEvent` object.

#### `abort(): void`

Aborts the ongoing request if it has been initiated.

#### `send(): Promise<R>`

Sends the HTTP request with the configured options. Returns a `Promise` that resolves with the response data of type `R` or rejects with the error. It also triggers the `onLoading`, `onCompleted`, and `onError` callbacks as appropriate.

## Error Handling

The `HttpService` includes a default error handler that intercepts Axios response errors. It checks for cancellation errors and publishes an "alertNotification" event (using a hypothetical `pubSub` mechanism) for non-limit-exceeded errors, displaying a user-friendly message. For errors indicating a limit has been exceeded (error codes between 7000 and 8000), it publishes a "limitExceeded" event with the error code. The `handleError` method ultimately rejects a promise with an `IApiErrorModel` containing information about the error.

## Type Definitions

```typescript
interface IApiErrorModel {
  success: boolean;
  message: string;
  error_code?: number;
}
```

## Example Usage

```typescript
import { HttpService } from './http-service';

interface Todo {
  userId: number;
  id: number;
  title: string;
  completed: boolean;
}

async function fetchTodos() {
  try {
    const todos = await HttpService.builder<undefined, Todo[]>()
      .setUrl('[https://jsonplaceholder.typicode.com/todos](https://www.google.com/search?q=https://jsonplaceholder.typicode.com/todos)')
      .setMethod('GET')
      .onLoading((isLoading) => console.log('Loading todos:', isLoading))
      .onCompleted((data) => console.log('Todos:', data))
      .onError((error) => console.error('Error fetching todos:', error))
      .send();
    console.log('Fetched todos:', todos);
  } catch (error) {
    console.error('Failed to fetch todos:', error);
  }
}

fetchTodos();

async function createTodo() {
  const newTodo = {
    userId: 1,
    title: 'Buy groceries',
    completed: false,
  };

  try {
    const createdTodo = await HttpService.builder<typeof newTodo, Todo>()
      .setUrl('[https://jsonplaceholder.typicode.com/todos](https://www.google.com/search?q=https://jsonplaceholder.typicode.com/todos)')
      .setMethod('POST')
      .setData(newTodo)
      .setHeaders({ 'Content-Type': 'application/json' })
      .onLoading((isLoading) => console.log('Creating todo:', isLoading))
      .onCompleted((data) => console.log('Created todo:', data))
      .onError((error) => console.error('Error creating todo:', error))
      .send();
    console.log('Created todo:', createdTodo);
  } catch (error) {
    console.error('Failed to create todo:', error);
  }
}

createTodo();
```