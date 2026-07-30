package com.mageireio.backend.config;

import com.mageireio.backend.security.JwtService;
import jakarta.servlet.http.Cookie;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.http.server.ServletServerHttpRequest;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.config.annotation.*;
import org.springframework.web.socket.server.HandshakeInterceptor;

import java.util.List;
import java.util.Map;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final JwtService jwtService;

    @Value("${app.cors.allowed-origins}")
    private String[] allowedOrigins;

    public WebSocketConfig(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        config.enableSimpleBroker("/topic");
        config.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws-orders")
                .setAllowedOrigins(allowedOrigins) // Δυναμικά από Env
                .addInterceptors(new HandshakeInterceptor() {
                    @Override
                    public boolean beforeHandshake(ServerHttpRequest request, ServerHttpResponse response, WebSocketHandler wsHandler, Map<String, Object> attributes) {
                        // ΕΞΑΓΩΓΗ COOKIE ΚΑΤΑ ΤΟ HTTP HANDSHAKE
                        if (request instanceof ServletServerHttpRequest servletRequest) {
                            Cookie[] cookies = servletRequest.getServletRequest().getCookies();
                            if (cookies != null) {
                                for (Cookie cookie : cookies) {
                                    if ("jwt".equals(cookie.getName())) {
                                        attributes.put("jwt", cookie.getValue()); // Το βάζουμε στο WS Session!
                                    }
                                }
                            }
                        }
                        return true;
                    }

                    @Override
                    public void afterHandshake(ServerHttpRequest request, ServerHttpResponse response, WebSocketHandler wsHandler, Exception exception) {}
                })
                .withSockJS();
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(new ChannelInterceptor() {
            @Override
            public Message<?> preSend(Message<?> message, MessageChannel channel) {
                StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
                
                if (accessor != null && StompCommand.CONNECT.equals(accessor.getCommand())) {
                    
                    String token = null;

                    // 1. Δοκιμάζουμε να πάρουμε το Token από τα Session Attributes (που βάλαμε στο Handshake από το Cookie)
                    Map<String, Object> sessionAttributes = accessor.getSessionAttributes();
                    if (sessionAttributes != null && sessionAttributes.containsKey("jwt")) {
                        token = (String) sessionAttributes.get("jwt");
                    }
                    
                    // 2. Αν δεν υπάρχει Cookie, ψάχνουμε το Header (Mobile App Fallback)
                    if (token == null) {
                        String authHeader = accessor.getFirstNativeHeader("Authorization");
                        if (authHeader != null && authHeader.startsWith("Bearer ")) {
                            token = authHeader.substring(7);
                        }
                    }

                    // Επικύρωση
                    if (token != null) {
                        try {
                            String username = jwtService.extractUsername(token);
                            if (username != null && jwtService.isTokenValid(token, username)) {
                                String role = jwtService.extractRole(token);
                                
                                if (!"ROLE_SUPER_ADMIN".equals(role) && !"ROLE_STORE_ADMIN".equals(role)) {
                                    System.err.println("🔒 WS Blocked: Insufficient privileges.");
                                    return null; 
                                }

                                UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                                        username, null, List.of(new SimpleGrantedAuthority(role)));
                                
                                accessor.setUser(auth);
                            } else {
                                return null;
                            }
                        } catch (Exception e) {
                            return null;
                        }
                    } else {
                        System.err.println("🔒 WS Blocked: No Auth found (neither Cookie nor Header).");
                        return null;
                    }
                }
                return message;
            }
        });
    }
}