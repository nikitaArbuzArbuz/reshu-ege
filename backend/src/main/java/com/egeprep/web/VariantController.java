package com.egeprep.web;

import com.egeprep.dto.TaskDtos;
import com.egeprep.service.VariantService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/variant")
public class VariantController {

    private final VariantService variantService;

    public VariantController(VariantService variantService) {
        this.variantService = variantService;
    }

    @PostMapping("/build")
    public TaskDtos.VariantBuildResponse build(@Valid @RequestBody TaskDtos.VariantBuildRequest body) {
        return variantService.build(body);
    }

    @PostMapping("/submit")
    public TaskDtos.VariantSubmitResponse submit(@Valid @RequestBody TaskDtos.VariantSubmitRequest body) {
        return variantService.submit(body);
    }
}
