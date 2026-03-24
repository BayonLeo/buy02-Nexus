package com.example.productservice.controller;

import com.example.productservice.model.Product;
import com.example.productservice.repository.ProductRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;


@SpringBootTest
@AutoConfigureMockMvc
public class ProductControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ProductRepository productRepository;

    // Test if post product with seller role is successful & if is present in database
    @Test
    @WithMockUser(authorities = "ROLE_SELLER")
    void shouldCreateProductWithSellerRole() throws Exception {
        String productJson = "{ \"name\": \"Test Product\", \"description\": \"A product for testing\", \"price\": 99.99, \"quantity\": 6 }";

        when(productRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        mockMvc.perform(post("/api/products")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(productJson)
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Test Product"))
                .andExpect(jsonPath("$.description").value("A product for testing"))
                .andExpect(jsonPath("$.price").value(99.99))
                .andExpect(jsonPath("$.quantity").value(6));
    }

    // Test to get product by id
    @Test
    void shouldGetProductById() throws Exception {
        Product product = new Product();
        product.setId("prod123");
        product.setName("Sample Product");
        product.setDescription("Sample Description");
        product.setPrice(49.99);

        when(productRepository.findById("prod123")).thenReturn(java.util.Optional.of(product));

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get("/api/products/prod123"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("prod123"))
                .andExpect(jsonPath("$.name").value("Sample Product"))
                .andExpect(jsonPath("$.description").value("Sample Description"))
                .andExpect(jsonPath("$.price").value(49.99));
    }

    // Test to update product with seller role
    @Test
    @WithMockUser(username = "seller1", authorities = "ROLE_SELLER")
    void shouldUpdateProductWithSellerRole() throws Exception {
        String updatedProductJson = "{ \"name\": \"Updated Product\", \"description\": \"Updated Description\", \"price\": 79.99 }";
        Product existingProduct = new Product();
        existingProduct.setId("prod123");
        existingProduct.setUserId("seller1");
        existingProduct.setName("Old Product");
        existingProduct.setDescription("Old Description");
        existingProduct.setPrice(59.99);

        when(productRepository.findById("prod123")).thenReturn(java.util.Optional.of(existingProduct));
        when(productRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put("/api/products/prod123")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(updatedProductJson)
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Updated Product"))
                .andExpect(jsonPath("$.description").value("Updated Description"))
                .andExpect(jsonPath("$.price").value(79.99));
    }

    // Test to delete product with seller role
    @Test
    @WithMockUser(username = "seller1", authorities = "ROLE_SELLER")
    void shouldDeleteProductWithSellerRole() throws Exception {
        Product existingProduct = new Product();
        existingProduct.setId("prod123");
        existingProduct.setUserId("seller1");

        when(productRepository.findById("prod123")).thenReturn(java.util.Optional.of(existingProduct));

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete("/api/products/prod123")
                        .with(csrf()))
                .andExpect(status().isNoContent());
    }

    // Test to list all products
    @Test
    void shouldListAllProducts() throws Exception {
        Product product1 = new Product();
        product1.setId("prod1");
        product1.setName("Product 1");
        Product product2 = new Product();
        product2.setId("prod2");
        product2.setName("Product 2");
        java.util.List<Product> productList = java.util.Arrays.asList(product1, product2);

        when(productRepository.findAll()).thenReturn(productList);

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get("/api/products"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value("prod1"))
                .andExpect(jsonPath("$[1].id").value("prod2"));
    }

}