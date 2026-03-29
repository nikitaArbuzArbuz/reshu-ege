package com.egeprep.util;

public final class AnswerNormalizer {

    private AnswerNormalizer() {
    }

    public static String normalize(String raw) {
        if (raw == null) {
            return "";
        }
        String s = raw.trim().toLowerCase().replace(',', '.');
        s = s.replaceAll("\\s+", " ");
        return s;
    }
}
