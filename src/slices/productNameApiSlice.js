import { PRODUCTSNAME_URL } from "../../constants";
import { apiSlice } from "./apiSlice";

export const productsNameApiSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getProductsName: builder.query({
            query: () => ({
                url: PRODUCTSNAME_URL,
            }),
            keepUnusedDataFor: 5,
            providesTags: ["ProductName"],
        }),
        getProductNameDetails: builder.query({
            query: (productId) => ({
                url: `${PRODUCTSNAME_URL}/${productId}`,
            }),
            keepUnusedDataFor: 5,
            providesTags: ["ProductName"],
        }),
        createProductName: builder.mutation({
            query: () => ({
                url: PRODUCTSNAME_URL,
                method: "POST",
            }),
            invalidatesTags: ["ProductName"],
        }),
        updateProductName: builder.mutation({
            query: (data) => ({
                url: `${PRODUCTSNAME_URL}/${data.productId}`,
                method: "PUT",
                body: data,
            }),
            invalidatesTags: ["ProductName"],
        }),
        deleteProductName: builder.mutation({
            query: (productId) => ({
                url: `${PRODUCTSNAME_URL}/${productId}`,
                method: "DELETE",
            }),
            invalidatesTags: ["ProductName"],
        }),
    }),
});

export const {
    useGetProductsNameQuery,
    useGetProductNameDetailsQuery,
    useCreateProductNameMutation,
    useUpdateProductNameMutation,
    useDeleteProductNameMutation,
} = productsNameApiSlice;
