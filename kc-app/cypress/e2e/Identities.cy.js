import Identities from "../pages/Identities"

 const identities = new Identities()
  
 describe("testing home page", () => {
   it("should visit home page", () => {
     identities.visit()
     cy.wait(5000)
   })
  
   it("should search for a product", () => {
     identities.visit()
     identities.getCreateButton()
     cy.wait(5000)
     identities.getWalletButton()
     cy.wait(5000)
     identities.getCreateButton().click()
   })

   it("Create New DID", () => {
    cy.wait(5000)
    identities.visit()
    identities.getNameField().click().type("Hello")
    identities.getCreateActionButton().click()
    cy.wait(5000)
  })
 })