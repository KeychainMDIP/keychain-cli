class Identities {
  constructor() {

    this.title = "Keymaster Wallet Demo"
  }
    visit() {
      cy.visit("/")
    }
   
    getDemoAppName(text) {
      return cy.get('#root > div > header > h1').first().type(text)
    }
   
    getCreateButton() {
      return cy.contains('Create ID')
    }

    getWalletButton() {
      return cy.get('.MuiTabs-flexContainer > [tabindex="-1"]').click()
    }
   
    getRemoveButtonn() {
      return cy.get(
        "#root > div > header > div:nth-child(4) > div > div:nth-child(3) > div:nth-child(2) > button"
      ).second()
    }
   
    getBackupButton() {
      return cy.get(
        "#root > div > header > div:nth-child(4) > div > div:nth-child(3) > div:nth-child(3) > button"
      )
    }
   
    getRecoverButton() {
      return cy.get(
        "#root > div > header > div:nth-child(4) > div > div:nth-child(3) > div:nth-child(4) > button"
      )
    }
   
    getNameField() {
      return cy.get('#\:r0\:')
    }
   
    getCreateActionButton() {
      return cy.get('.css-rfnosa > :nth-child(2) > :nth-child(1)')
    }
   
    getMyAccountLink() {
      return cy.get(
        "#widget-navbar-217834 > ul > li:nth-child(6) > a > div > span"
      )
    }
  }

  module.exports = Identities