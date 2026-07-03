package com.cuentasclaras.back.controller;

import com.cuentasclaras.back.dto.CreateUserRequest;
import com.cuentasclaras.back.dto.UserDto;
import com.cuentasclaras.back.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/usuarios")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping("/registro")
    @ResponseStatus(HttpStatus.CREATED)         // devuelve 201 en vez de 200
    public UserDto register(@Valid @RequestBody CreateUserRequest request) {
        return userService.register(request);
    }

    @GetMapping
    public List<UserDto> getAll() {
        return userService.getAll();
    }

    @GetMapping("/{id}")
    public UserDto getById(@PathVariable Long id) {
        return userService.getById(id);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)      // devuelve 204 (éxito sin body)
    public void delete(@PathVariable Long id) {
        userService.delete(id);
    }
}