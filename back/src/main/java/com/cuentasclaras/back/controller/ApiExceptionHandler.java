package com.cuentasclaras.back.controller;

import com.cuentasclaras.back.exception.FondoInsuficienteException;
import com.cuentasclaras.back.exception.ForbiddenException;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import com.cuentasclaras.back.exception.MoraException;

import java.util.Map;

@RestControllerAdvice
public class ApiExceptionHandler {

    @ExceptionHandler(IllegalArgumentException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public Map<String, String> handleIllegalArgument(IllegalArgumentException exception) {
        return Map.of("error", exception.getMessage());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Map<String, String> handleValidation(MethodArgumentNotValidException exception) {
        return Map.of("error", "Request invalido");
    }

    @ExceptionHandler(ForbiddenException.class)
    @ResponseStatus(HttpStatus.FORBIDDEN)
    public Map<String, String> handleForbidden(ForbiddenException exception) {
        return Map.of("error", exception.getMessage());
    }

    @ExceptionHandler(IllegalStateException.class)
    @ResponseStatus(HttpStatus.UNPROCESSABLE_ENTITY)
    public Map<String, String> handleIllegalState(IllegalStateException exception) {
        return Map.of("error", exception.getMessage());
    }

    @ExceptionHandler(FondoInsuficienteException.class)
    @ResponseStatus(HttpStatus.UNPROCESSABLE_ENTITY)
    public Map<String, Object> handleFondoInsuficiente(FondoInsuficienteException exception) {
        return Map.of(
            "error", exception.getMessage(),
            "code",  "FONDO_INSUFICIENTE"
        );
    }

    @ExceptionHandler(MoraException.class)
    @ResponseStatus(HttpStatus.LOCKED)
    public Map<String, Object> handleMora(MoraException ex) {
        return Map.of("error", ex.getMessage(), "code", "EN_MORA");
    }
}
