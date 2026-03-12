/*
 * Copyright 2002-2022 the original author or authors.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package org.springframework.samples.petclinic.web;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Collection;
import java.util.List;
import java.util.Map;

import jakarta.annotation.PostConstruct;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.samples.petclinic.model.Owner;
import org.springframework.samples.petclinic.service.ClinicService;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.WebDataBinder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.ModelAndView;

import tools.jackson.databind.ObjectMapper;

/**
 * @author Juergen Hoeller
 * @author Ken Krebs
 * @author Arjen Poutsma
 * @author Michael Isvy
 */
@Controller
public class OwnerController {

    private static final String VIEWS_OWNER_CREATE_OR_UPDATE_FORM = "owners/createOrUpdateOwnerForm";
    private final ClinicService clinicService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("classpath:vue/find-owners.html")
    private Resource findOwnersHtmlResource;
    private String findOwnersHtmlTemplate;

    public OwnerController(ClinicService clinicService) {
        this.clinicService = clinicService;
    }

    @PostConstruct
    void loadTemplates() throws IOException {
        findOwnersHtmlTemplate = new String(
            findOwnersHtmlResource.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
    }

    @InitBinder
    public void setAllowedFields(WebDataBinder dataBinder) {
        dataBinder.setDisallowedFields("id");
    }

    // ── Vue SPA host pages ──

    @GetMapping(value = "/owners/find", produces = "text/html")
    @ResponseBody
    public String findOwnersPage() {
        return findOwnersHtmlTemplate;
    }

    @GetMapping(value = "/owners", produces = "text/html")
    public void ownersPage(
            @RequestParam(value = "lastName", required = false) String lastName,
            HttpServletResponse response) throws Exception {
        if (lastName == null) {
            response.setContentType("text/html;charset=UTF-8");
            response.getWriter().write(findOwnersHtmlTemplate);
            return;
        }

        Collection<Owner> results = this.clinicService.findOwnerByLastName(lastName);
        if (results.size() == 1) {
            response.sendRedirect("/owners/" + results.iterator().next().getId());
            return;
        }

        // Embed data into HTML for immediate rendering
        String dataScript;
        if (results.isEmpty()) {
            dataScript = "<script>window.__PETCLINIC_ERROR__="
                + objectMapper.writeValueAsString("has not been found") + ";"
                + "window.__PETCLINIC_SEARCH_TERM__="
                + objectMapper.writeValueAsString(lastName) + ";</script>\n";
        } else {
            List<OwnerDto> dtos = results.stream().map(this::toDto).toList();
            dataScript = "<script>window.__PETCLINIC_OWNERS__="
                + objectMapper.writeValueAsString(dtos) + ";</script>\n";
        }
        String html = findOwnersHtmlTemplate.replace("</body>", dataScript + "</body>");
        response.setContentType("text/html;charset=UTF-8");
        response.getWriter().write(html);
    }

    // ── REST API for SPA consumption ──

    @GetMapping(value = "/api/owners")
    @ResponseBody
    public List<OwnerDto> searchOwnersApi(
            @RequestParam(value = "lastName", required = false) String lastName) {
        if (lastName == null) {
            lastName = "";
        }
        return this.clinicService.findOwnerByLastName(lastName).stream()
            .map(this::toDto)
            .toList();
    }

    private OwnerDto toDto(Owner owner) {
        List<OwnerDto.PetDto> pets = owner.getPets().stream()
            .map(p -> new OwnerDto.PetDto(p.getName()))
            .toList();
        Integer id = owner.getId();
        return new OwnerDto(
            id != null ? id : 0, owner.getFirstName(), owner.getLastName(),
            owner.getAddress(), owner.getCity(), owner.getTelephone(), pets);
    }

    // ── Legacy JSP endpoints (other owner screens) ──

    @GetMapping(value = "/owners/new")
    public String initCreationForm(Map<String, Object> model) {
        Owner owner = new Owner();
        model.put("owner", owner);
        return VIEWS_OWNER_CREATE_OR_UPDATE_FORM;
    }

    @PostMapping(value = "/owners/new")
    public String processCreationForm(@Valid Owner owner, BindingResult result) {
        if (result.hasErrors()) {
            return VIEWS_OWNER_CREATE_OR_UPDATE_FORM;
        }

        this.clinicService.saveOwner(owner);
        return "redirect:/owners/" + owner.getId();
    }

    @GetMapping(value = "/owners/{ownerId}/edit")
    public String initUpdateOwnerForm(@PathVariable("ownerId") int ownerId, Model model) {
        Owner owner = this.clinicService.findOwnerById(ownerId);
        model.addAttribute(owner);
        return VIEWS_OWNER_CREATE_OR_UPDATE_FORM;
    }

    @PostMapping(value = "/owners/{ownerId}/edit")
    public String processUpdateOwnerForm(@Valid Owner owner, BindingResult result, @PathVariable("ownerId") int ownerId) {
        if (result.hasErrors()) {
            return VIEWS_OWNER_CREATE_OR_UPDATE_FORM;
        }

        owner.setId(ownerId);
        this.clinicService.saveOwner(owner);
        return "redirect:/owners/{ownerId}";
    }

    /**
     * Custom handler for displaying an owner.
     *
     * @param ownerId the ID of the owner to display
     * @return a ModelMap with the model attributes for the view
     */
    @GetMapping("/owners/{ownerId}")
    public ModelAndView showOwner(@PathVariable("ownerId") int ownerId) {
        ModelAndView mav = new ModelAndView("owners/ownerDetails");
        mav.addObject(this.clinicService.findOwnerById(ownerId));
        return mav;
    }

}
