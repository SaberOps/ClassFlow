package com.classflow.backendspringboot.user.admin;

import java.security.SecureRandom;

final class TemporaryPasswordGenerator {

    private static final String UPPERCASE = "ABCDEFGHJKLMNPQRSTUVWXYZ";
    private static final String LOWERCASE = "abcdefghijkmnopqrstuvwxyz";
    private static final String DIGITS = "23456789";
    private static final String SYMBOLS = "!@#$%";
    private static final String ALL_CHARACTERS = UPPERCASE + LOWERCASE + DIGITS + SYMBOLS;
    private static final SecureRandom RANDOM = new SecureRandom();

    private TemporaryPasswordGenerator() {
    }

    static String generate() {
        char[] password = new char[16];
        password[0] = randomCharacter(UPPERCASE);
        password[1] = randomCharacter(LOWERCASE);
        password[2] = randomCharacter(DIGITS);
        password[3] = randomCharacter(SYMBOLS);
        for (int i = 4; i < password.length; i++) {
            password[i] = randomCharacter(ALL_CHARACTERS);
        }
        for (int i = password.length - 1; i > 0; i--) {
            int swapIndex = RANDOM.nextInt(i + 1);
            char current = password[i];
            password[i] = password[swapIndex];
            password[swapIndex] = current;
        }
        return new String(password);
    }

    private static char randomCharacter(String characters) {
        return characters.charAt(RANDOM.nextInt(characters.length()));
    }
}
