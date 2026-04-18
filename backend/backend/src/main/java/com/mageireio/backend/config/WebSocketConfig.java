package com.mageireio.backend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.*;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // Ο Message Broker θα στέλνει μηνύματα στο κανάλι /topic
        config.enableSimpleBroker("/topic");
        config.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Η διεύθυνση που θα συνδέεται το React
        registry.addEndpoint("/ws-orders")
                .setAllowedOriginPatterns("*")
                .withSockJS();
    }
}