import { PRODUCTSSIZE_URL } from "../../constants";
import { apiSlice } from "./apiSlice";

export const productsSizeApiSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getProductsSize: builder.query({
            query: () => ({
                url: PRODUCTSSIZE_URL,
            }),
            keepUnusedDataFor: 5,
            providesTags: ["ProductSize"],
        }),
    }),
});

export const { useGetProductsSizeQuery } = productsSizeApiSlice;
