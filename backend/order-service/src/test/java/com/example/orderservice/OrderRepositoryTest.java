package com.example.orderservice.repository;

import com.example.orderservice.model.Order;
import com.example.orderservice.model.OrderItem;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.data.mongo.DataMongoTest;

import java.util.ArrayList;
import java.util.List;

@DataMongoTest
public class OrderRepositoryTest {

    @Autowired
    private OrderRepository orderRepository;

    @BeforeEach
    void cleanUp() { orderRepository.deleteAll(); }

    @Test
    void shouldSaveOrder() {
        Order order = new Order();
        OrderItem item = new OrderItem("product-123", "product-name", "seller-1", 12.5, 2);
        List<OrderItem> items = new ArrayList<>();
        items.add(item);
        order.setItems(items);
        order.setUserId("user-123");
        order.setAmount(25.0);

        Order saved = orderRepository.save(order);
        assert saved.getId() != null;
        assert saved.getItems() != null && !saved.getItems().isEmpty();
        assert saved.getItems().get(0).getProductId().equals("product-123");
        assert saved.getItems().get(0).getQuantity() == 2;
        assert saved.getUserId().equals("user-123");
    }
}