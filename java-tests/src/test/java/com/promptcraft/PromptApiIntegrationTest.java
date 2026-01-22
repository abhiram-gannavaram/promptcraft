package com.promptcraft;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.time.Duration;

import static org.junit.jupiter.api.Assertions.*;

class PromptApiIntegrationTest {
    private static final String API_ENDPOINT = "https://njzzp0serg.execute-api.us-east-1.amazonaws.com/prod/generate-prompt";
    private static final MediaType JSON = MediaType.parse("application/json");
    private static OkHttpClient client;
    private static ObjectMapper mapper;

    @BeforeAll
    static void setUp() {
        client = new OkHttpClient.Builder()
                .callTimeout(Duration.ofSeconds(20))
                .build();
        mapper = new ObjectMapper();
    }

    @AfterAll
    static void tearDown() {
        client = null;
        mapper = null;
    }

    @Test
    void poemPrompt_returnsParagraphOnlyAndPoetryType() throws IOException {
        JsonNode response = postPrompt("write a poem on ai");

        assertTrue(response.get("success").asBoolean());
        assertEquals("poetry", response.get("requestType").asText());

        String enhanced = response.get("enhancedPrompt").asText();
        assertNotNull(enhanced);
        assertTrue(enhanced.toLowerCase().contains("poem"));
        assertTrue(enhanced.contains("AI"));
        assertFalse(enhanced.contains("\n"), "Enhanced prompt should be a single paragraph");
        assertFalse(enhanced.contains("**"), "No markdown headings or bold markers");
        assertFalse(enhanced.contains("•"), "No bullet points");
    }

    @Test
    void imageEditPrompt_returnsImageGenerationType() throws IOException {
        JsonNode response = postPrompt("Convert this image to Hyderabad nawab like a ruler and remove the red flower in hand keep him like a king");

        assertTrue(response.get("success").asBoolean());
        assertEquals("image_generation", response.get("requestType").asText());

        String enhanced = response.get("enhancedPrompt").asText();
        assertNotNull(enhanced);
        assertFalse(enhanced.contains("\n"));
        assertTrue(enhanced.toLowerCase().contains("image") || enhanced.toLowerCase().contains("prompt"));
    }

    @Test
    void appPrompt_returnsAppDevelopmentType() throws IOException {
        JsonNode response = postPrompt("build a todo app for iphone with login");

        assertTrue(response.get("success").asBoolean());
        assertEquals("app_development", response.get("requestType").asText());

        String enhanced = response.get("enhancedPrompt").asText();
        assertNotNull(enhanced);
        assertFalse(enhanced.contains("\n"));
        assertTrue(enhanced.toLowerCase().contains("ios"));
    }

    @Test
    void generalPrompt_returnsParagraphOnly() throws IOException {
        JsonNode response = postPrompt("Explain quantum computing like I'm five");

        assertTrue(response.get("success").asBoolean());
        assertNotNull(response.get("enhancedPrompt").asText());
        assertFalse(response.get("enhancedPrompt").asText().contains("\n"));
    }

    @Test
    void emptyPrompt_returnsValidationError() throws IOException {
        JsonNode response = postPromptExpectingError("   ", 400);

        assertNotNull(response.get("error"));
        assertNotNull(response.get("message"));
    }

    @Test
    void tooLongPrompt_returnsValidationError() throws IOException {
        String longPrompt = "a".repeat(10001);
        JsonNode response = postPromptExpectingError(longPrompt, 400);

        assertNotNull(response.get("error"));
        assertNotNull(response.get("message"));
    }

    private JsonNode postPrompt(String prompt) throws IOException {
        return postPromptWithExpectedStatus(prompt, 200);
    }

    private JsonNode postPromptExpectingError(String prompt, int expectedStatus) throws IOException {
        return postPromptWithExpectedStatus(prompt, expectedStatus);
    }

    private JsonNode postPromptWithExpectedStatus(String prompt, int expectedStatus) throws IOException {
        String payload = mapper.createObjectNode()
                .put("prompt", prompt)
                .toString();

        Request request = new Request.Builder()
                .url(API_ENDPOINT)
                .post(RequestBody.create(payload, JSON))
                .build();

        try (Response response = client.newCall(request).execute()) {
            assertEquals(expectedStatus, response.code());
            String body = response.body() != null ? response.body().string() : "";
            assertFalse(body.isBlank(), "Response body should not be empty");
            return mapper.readTree(body);
        }
    }
}
