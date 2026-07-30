package com.mageireio.backend.service;

import com.mageireio.backend.model.CustomerOrder;
import com.mageireio.backend.model.StoreSettings;
import com.mageireio.backend.repository.OrderRepository;
import com.mageireio.backend.repository.StoreSettingsRepository;
import org.springframework.http.*;
import org.springframework.http.converter.StringHttpMessageConverter;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestTemplate;

import java.nio.charset.StandardCharsets;
import java.util.*;

@Service
public class WoltService {

    private final OrderRepository orderRepository;
    private final StoreSettingsRepository storeSettingsRepository;
    private final RestTemplate restTemplate;

    private static final String WOLT_BASE_URL = "https://daas-public-api.development.dev.woltapi.com";

    public WoltService(OrderRepository orderRepository, StoreSettingsRepository storeSettingsRepository) {
        this.orderRepository = orderRepository;
        this.storeSettingsRepository = storeSettingsRepository;
        this.restTemplate = new RestTemplate();
        
        this.restTemplate.getMessageConverters().stream()
            .filter(converter -> converter instanceof StringHttpMessageConverter)
            .forEach(converter -> ((StringHttpMessageConverter) converter).setDefaultCharset(StandardCharsets.UTF_8));
    }

    // Βοηθητική μέθοδος για να καθαρίζει τη διεύθυνση από ορόφους/κουδούνια/GPS
    private Map<String, Object> extractCleanAddressInfo(String rawAddress) {
        Map<String, Object> info = new HashMap<>();
        String cleanAddress = rawAddress;
        Double lat = null;
        Double lon = null;

        if (rawAddress != null && rawAddress.contains("| GPS:")) {
            String[] parts = rawAddress.split("\\| GPS: ");
            cleanAddress = parts[0].trim();
            try {
                String gpsUrl = parts[1].trim();
                String[] coords = gpsUrl.replace("https://www.google.com/maps?q=", "").split(",");
                lat = Double.parseDouble(coords[0]);
                lon = Double.parseDouble(coords[1]);
            } catch (Exception ignored) {}
        }

        if (cleanAddress != null && cleanAddress.contains("(")) {
            cleanAddress = cleanAddress.substring(0, cleanAddress.indexOf("(")).trim();
        }

        info.put("street", cleanAddress != null ? cleanAddress : "");
        info.put("lat", lat);
        info.put("lon", lon);
        return info;
    }

    public Double getDeliveryFee(Double lat, Double lon, String address, StoreSettings settings) {
        if (settings.getWoltApiKey() == null || settings.getWoltApiKey().isEmpty()) return 0.0;

        String url = WOLT_BASE_URL + "/merchants/" + settings.getWoltMerchantId() + "/delivery-fee";
        Map<String, Object> payload = new HashMap<>();
        
        Map<String, Object> pickup = new HashMap<>();
        Map<String, Object> pickupLocation = new HashMap<>();
        pickupLocation.put("formatted_address", settings.getStore().getAddress());
        pickup.put("location", pickupLocation);
        payload.put("pickup", pickup);

        Map<String, Object> dropoff = new HashMap<>();
        Map<String, Object> dropoffLocation = new HashMap<>();
        // Καθαρίζουμε και εδώ τη διεύθυνση
        dropoffLocation.put("formatted_address", extractCleanAddressInfo(address).get("street"));
        
        Map<String, Double> coordinates = new HashMap<>();
        coordinates.put("lat", lat);
        coordinates.put("lon", lon);
        dropoffLocation.put("coordinates", coordinates);
        
        dropoff.put("location", dropoffLocation);
        payload.put("dropoff", dropoff);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(settings.getWoltApiKey());

        try {
            ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.POST, new HttpEntity<>(payload, headers), Map.class);
            if (response.getStatusCode() == HttpStatus.CREATED && response.getBody() != null) {
                Map<String, Object> feeObj = (Map<String, Object>) response.getBody().get("fee");
                return Double.valueOf(feeObj.get("amount").toString());
            }
        } catch (HttpStatusCodeException e) {
            System.err.println("--- WOLT DELIVERY FEE ERROR ---");
            System.err.println(e.getResponseBodyAsString()); // Τυπώνει το ακριβές λάθος της Wolt
        } catch (Exception e) {
            System.err.println("Σφάλμα υπολογισμού Wolt Fee: " + e.getMessage());
        }
        return 0.0;
    }

    public CustomerOrder createWoltDelivery(CustomerOrder order) {
        StoreSettings settings = storeSettingsRepository.findByStoreId(order.getStore().getId())
                .orElseThrow(() -> new RuntimeException("Δεν βρέθηκαν ρυθμίσεις."));

        String venueId = settings.getWoltMerchantId();
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(settings.getWoltApiKey());

        // Καθαρισμός Διεύθυνσης
        Map<String, Object> addrInfo = extractCleanAddressInfo(order.getAddress());
        String promiseUrl = WOLT_BASE_URL + "/v1/venues/" + venueId + "/shipment-promises";
        Map<String, Object> promisePayload = new HashMap<>();
        promisePayload.put("street", addrInfo.get("street"));
        // Βάζουμε συντεταγμένες αν υπάρχουν (εξασφαλίζει Binding Promise)
        if (addrInfo.get("lat") != null) {
            promisePayload.put("lat", addrInfo.get("lat"));
            promisePayload.put("lon", addrInfo.get("lon"));
        } else {
            promisePayload.put("city", "Αθήνα"); 
        }
        promisePayload.put("min_preparation_time_minutes", 15);

        String promiseId;
        try {
            ResponseEntity<Map> promiseResponse = restTemplate.exchange(promiseUrl, HttpMethod.POST, new HttpEntity<>(promisePayload, headers), Map.class);
            promiseId = (String) promiseResponse.getBody().get("id");
        } catch (HttpStatusCodeException e) {
            System.err.println("--- WOLT PROMISE ERROR ---");
            System.err.println(e.getResponseBodyAsString());
            throw new RuntimeException("Απόρριψη από Wolt (Promise): " + e.getResponseBodyAsString());
        }

        String phone = order.getPhone();
        if (phone != null && !phone.startsWith("+30")) phone = "+30" + phone.replaceAll("\\s+", "");

        String deliveryUrl = WOLT_BASE_URL + "/v1/venues/" + venueId + "/deliveries";
        Map<String, Object> deliveryPayload = new HashMap<>();
        deliveryPayload.put("shipment_promise_id", promiseId);
        deliveryPayload.put("merchant_order_reference_id", order.getId().toString());

        Map<String, Object> dropoff = new HashMap<>();
        Map<String, Object> contactDetails = new HashMap<>();
        contactDetails.put("name", order.getCustomerName());
        contactDetails.put("phone_number", phone);
        dropoff.put("contact_details", contactDetails);
        deliveryPayload.put("dropoff", dropoff);

        Map<String, Object> recipient = new HashMap<>();
        recipient.put("name", order.getCustomerName());
        recipient.put("phone_number", phone);
        deliveryPayload.put("recipient", recipient);

        List<Map<String, Object>> parcels = new ArrayList<>();
        Map<String, Object> parcel = new HashMap<>();
        parcel.put("description", "Παραγγελία Φαγητού");
        parcels.add(parcel);
        deliveryPayload.put("parcels", parcels);

        try {
            ResponseEntity<Map> response = restTemplate.exchange(deliveryUrl, HttpMethod.POST, new HttpEntity<>(deliveryPayload, headers), Map.class);
            if (response.getStatusCode() == HttpStatus.CREATED && response.getBody() != null) {
                Map<String, Object> body = response.getBody();
                order.setWoltDeliveryId((String) body.get("wolt_order_reference_id"));
                order.setWoltTrackingUrl((String) ((Map<?, ?>) body.get("tracking")).get("url"));
                order.setWoltDeliveryStatus("created"); 
                return orderRepository.save(order);
            }
        } catch (HttpStatusCodeException e) {
            System.err.println("--- WOLT DELIVERY CREATION ERROR ---");
            System.err.println(e.getResponseBodyAsString());
            throw new RuntimeException("Απόρριψη από Wolt (Delivery): " + e.getResponseBodyAsString());
        }
        throw new RuntimeException("Άγνωστο σφάλμα Wolt.");
    }

    // 3. Ακύρωση Διανομέα
    public void cancelWoltDelivery(CustomerOrder order) {
        StoreSettings settings = storeSettingsRepository.findByStoreId(order.getStore().getId())
                .orElseThrow(() -> new RuntimeException("Δεν βρέθηκαν ρυθμίσεις"));

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(settings.getWoltApiKey());
        
        Map<String, String> payload = new HashMap<>();
        payload.put("reason", "Ακύρωση από το κατάστημα.");
        HttpEntity<Map<String, String>> request = new HttpEntity<>(payload, headers);

        String cancelUrl = WOLT_BASE_URL + "/order/" + order.getWoltDeliveryId() + "/status/cancel";

        try {
            ResponseEntity<Map> response = restTemplate.exchange(cancelUrl, HttpMethod.PATCH, request, Map.class);
            if (response.getStatusCode().is2xxSuccessful()) {
                order.setWoltDeliveryStatus("cancelled");
                orderRepository.save(order);
            }
        } catch (Exception e) {
            throw new RuntimeException("Αποτυχία ακύρωσης διανομέα Wolt.");
        }
    }
}