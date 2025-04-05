import axios, {
    type AxiosInstance,
    type AxiosRequestConfig,
    type RawAxiosRequestHeaders,
    type ResponseType,
} from "axios";

import { RequestBuilder } from "./httpRequestBuilder.ts";

/**
 * Represents the structure of a common API error response.
 */
interface IApiErrorModel {
    success: boolean;
    message: string;
    error_code?: number;
}

/**
 * A service class for making HTTP requests using Axios with default configurations and error handling.
 */
export default class HttpService {
    private axiosInstance: AxiosInstance;

    /**
     * Initializes a new HttpService instance with default configurations.
     */
    constructor() {
        this.axiosInstance = axios.create({
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json; charset=UTF-8",
            },
            withCredentials: false,
            withXSRFToken: true,
        });

        this.axiosInstance.interceptors.response.use((response) => {
            // Directly return the data object
            return response.data;
        }, this.handleError);
    }

    /**
     * Handles Axios response errors and formats them into an IApiErrorModel.
     * @private
     * @param {any} error - The error object received from Axios.
     * @returns {Promise<IApiErrorModel> | undefined} A rejected promise containing the formatted error, or undefined if the error is not handled.
     */
    private handleError = (
        error: any,
    ): Promise<IApiErrorModel> | undefined => {
        if (error?.code === "ERR_CANCELED") {
            return Promise.reject({ success: false, message: "Request canceled" });
        }

        const message = error?.response?.data?.message || "Something went wrong";

        return Promise.reject({
            success: false,
            message,
            error_code: error.response?.data?.error_code,
        } as IApiErrorModel);
    };

    /**
     * Makes an HTTP request with the specified configuration.
     * @template T - The type of the request body.
     * @template R - The expected type of the response data.
     * @param {AxiosRequestConfig<T>} config - The Axios request configuration object.
     * @param {Record<string, string>} [customHeaders] - Optional custom headers to include in the request.
     * @param {ResponseType} [responseType="json"] - The expected response type for the request. Defaults to 'json'.
     * @returns {Promise<R>} A promise that resolves with the response data of type R.
     * @throws {Promise<IApiErrorModel>} If the request fails and the error is handled.
     */
    public async request<T, R>(
        config: AxiosRequestConfig<T>,
        customHeaders?: Record<string, string>,
        responseType: ResponseType = "json",
    ): Promise<R> {
        const headers = {
            ...this.axiosInstance.defaults.headers.common,
            ...(config.headers || {}),
            ...customHeaders,
        } as RawAxiosRequestHeaders;

        try {
            const response: R = await this.axiosInstance.request({
                ...config,
                headers,
                responseType,
                signal: config?.signal,
            });

            return response;
        } catch (error) {
            if (config?.signal?.aborted) {
                return Promise.reject({ success: false, message: "Request canceled" });
            }
            throw error;
        }
    }

    /**
     * Creates a new instance of the RequestBuilder for constructing HTTP requests with a fluent API.
     * @template T - The type of the request body.
     * @template R - The expected type of the response data.
     * @returns {RequestBuilder<T, R>} A new RequestBuilder instance.
     */
    public static builder<T, R>(): RequestBuilder<T, R> {
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        return new RequestBuilder<T, R>();
    }
}