import {
    type AxiosProgressEvent,
    type AxiosRequestConfig,
    type AxiosResponse,
    type ResponseType,
} from "axios";
import HttpService  from "./index.ts";

/**
 * A builder class for constructing and sending HTTP requests with a fluent API, including support for callbacks.
 * @template T - The type of the request body.
 * @template R - The expected type of the response data.
 */
export class RequestBuilder<T, R> {
    private requestUrl!: string;
    private requestMethod: "GET" | "POST" | "PUT" | "PATCH" | "DELETE" = "GET";
    private requestData?: T;
    private requestParams?: any;
    private requestHeaders?: Record<string, string>;
    private requestConfig?: AxiosRequestConfig<any>;
    private responseType: ResponseType = "json"; // Add responseType property, default is 'json'
    private onCompletedCallback?: (response: R) => void; // Updated to expect R directly
    private onErrorCallback?: (error: any) => void;
    private onLoadingCallback?: (loading: boolean) => void;
    private onProgressCallback?: (progressEvent: AxiosProgressEvent) => void;
    private abortController?: AbortController;

    /**
     * Sets the URL for the request.
     * @param {string} url - The request URL.
     * @returns {this} The RequestBuilder instance for chaining.
     */
    public setUrl(url: string): this {
        this.requestUrl = url;
        return this;
    }

    /**
     * Sets the HTTP method for the request.
     * @param {"GET" | "POST" | "PUT" | "PATCH" | "DELETE"} method - The HTTP method.
     * @returns {this} The RequestBuilder instance for chaining.
     */
    public setMethod(method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE"): this {
        this.requestMethod = method;
        return this;
    }

    /**
     * Sets the request body data.
     * @param {T} data - The request body.
     * @returns {this} The RequestBuilder instance for chaining.
     */
    public setData(data: T): this {
        this.requestData = data;
        return this;
    }

    /**
     * Sets the URL query parameters.
     * @param {any} params - The query parameters to be appended to the URL.
     * @returns {this} The RequestBuilder instance for chaining.
     */
    public setParams(params: any): this {
        this.requestParams = params;
        return this;
    }

    /**
     * Sets custom headers for the request.
     * @param {Record<string, string>} headers - An object containing key-value pairs for custom headers.
     * @returns {this} The RequestBuilder instance for chaining.
     */
    public setHeaders(headers: Record<string, string>): this {
        this.requestHeaders = headers;
        return this;
    }

    /**
     * Sets additional Axios request configuration options.
     * @param {AxiosRequestConfig<any>} config - An object containing additional Axios request configurations.
     * @returns {this} The RequestBuilder instance for chaining.
     */
    public setConfig(config: AxiosRequestConfig<any>): this {
        this.requestConfig = config;
        return this;
    }

    /**
     * Sets the expected response type for the request.
     * @param {ResponseType} responseType - The response type (e.g., 'json', 'blob', 'arraybuffer'). Defaults to 'json'.
     * @returns {this} The RequestBuilder instance for chaining.
     */
    public setResponseType(responseType: ResponseType): this {
        this.responseType = responseType;
        return this;
    }

    /**
     * Sets a callback function to be executed when the request is successful and the data is received.
     * @param {(response: R) => void} callback - The callback function that receives the response data.
     * @returns {this} The RequestBuilder instance for chaining.
     */
    public onCompleted(callback: (response: R) => void): this {
        // Updated to R
        this.onCompletedCallback = callback;
        return this;
    }

    /**
     * Sets a callback function to be executed when the request fails.
     * @param {(error: any) => void} callback - The callback function that receives the error object.
     * @returns {this} The RequestBuilder instance for chaining.
     */
    public onError(callback: (error: any) => void): this {
        this.onErrorCallback = callback;
        return this;
    }

    /**
     * Sets a callback function that is called with the loading state of the request.
     * @param {(loading: boolean) => void} callback - The callback function that receives a boolean indicating if the request is loading.
     * @returns {this} The RequestBuilder instance for chaining.
     */
    public onLoading(callback: (loading: boolean) => void): this {
        this.onLoadingCallback = callback;
        return this;
    }

    /**
     * Sets a callback function that is called during the request progress (both upload and download).
     * @param {(progressEvent: AxiosProgressEvent) => void} callback - The callback function that receives an AxiosProgressEvent object.
     * @returns {this} The RequestBuilder instance for chaining.
     */
    public onProgress(
        callback: (progressEvent: AxiosProgressEvent) => void,
    ): this {
        this.onProgressCallback = callback;
        return this;
    }

    /**
     * Aborts the ongoing request, if any.
     */
    public abort(): void {
        this?.abortController?.abort();
    }

    /**
     * Sends the HTTP request with the configured options.
     * @returns {Promise<R>} A promise that resolves with the response data of type R, or rejects with an error.
     */
    public async send(): Promise<R> {
        if (this.onLoadingCallback) {
            this.onLoadingCallback(true);
        }

        const httpService = new HttpService();

        // Initialize AbortController for this request
        this.abortController = new AbortController();

        try {
            const response = await httpService.request<T, R>(
                {
                    url: this.requestUrl,
                    method: this.requestMethod,
                    data: this.requestData,
                    params: this.requestParams,
                    headers: this.requestHeaders,
                    onUploadProgress: this.onProgressCallback,
                    onDownloadProgress: this.onProgressCallback,
                    signal: this.abortController.signal,
                    ...this.requestConfig,
                },
                undefined,
                this.responseType,
            );

            const data = (response as AxiosResponse)?.data as R;
            if (this.onCompletedCallback) {
                this.onCompletedCallback(data);
            }

            return data;
        } catch (error) {
            if (this.onErrorCallback) {
                this.onErrorCallback(error);
            }
            throw error;
        } finally {
            if (this.onLoadingCallback) {
                this.onLoadingCallback(false);
            }
        }
    }
}