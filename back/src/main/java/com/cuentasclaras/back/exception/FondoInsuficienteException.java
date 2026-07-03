// back/src/main/java/com/cuentasclaras/back/exception/FondoInsuficienteException.java
package com.cuentasclaras.back.exception;

public class FondoInsuficienteException extends RuntimeException {
    public FondoInsuficienteException(String message) {
        super(message);
    }
}