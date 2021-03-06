'use strict';

var webdriver = require('selenium-webdriver');
var idSelectors = false;

module.exports = function Page(browser) {

	// ----------------- utility methods

	this.tryFindByXpath = function (xpath) {
		return browser.findElements(webdriver.By.xpath(xpath));
	};

	this.findByXpath = function (xpath) {
		return browser.findElement(webdriver.By.xpath(xpath));
	};

	this.getTodoListXpath = function () {
		return !idSelectors ? '//ul[@id="todo-list"]' : '//ul[@class="todo-list"]';
	};

	this.getMainSectionXpath = function () {
		return !idSelectors ? '//section[@id="main"]' : '//section[contains(@class, "main")]';
	};

	this.getFooterSectionXpath = function () {
		return !idSelectors ? '//footer[@id="footer"]' : '//footer[contains(@class, "footer")]';
	};

	this.getCompletedButtonXpath = function () {
		return !idSelectors ? '//button[@id="clear-completed"]' : '//button[contains(@class, "clear-completed")]';
	};

	this.getNewInputXpath = function () {
		return !idSelectors ? '//input[@id="new-todo"]' : '//input[contains(@class,"new-todo")]';
	};

	this.getToggleAllXpath = function () {
		return !idSelectors ? '//input[@id="toggle-all"]' : '//input[contains(@class,"toggle-all")]';
	};

	this.getCountXpath = function () {
		return !idSelectors ? '//span[@id="todo-count"]' : '//span[contains(@class, "todo-count")]';
	};

	this.getFilterElementsXpath = function () {
		return !idSelectors ? '//ul[@id="filters"]//a' : '//ul[contains(@class, "filters")]';
	};

	this.xPathForItemAtIndex = function (index) {
		// why is XPath the only language silly enough to be 1-indexed?
		return this.getTodoListXpath() + '/li[' + (index + 1) + ']';
	};

	// ----------------- navigation methods

	this.back = function () {
		return browser.navigate().back();
	};

	// ----------------- try / get methods

	// unfortunately webdriver does not have a decent API for determining if an
	// element exists. The standard approach is to obtain an array of elements
	// and test that the length is zero. These methods are used to obtain
	// elements which *might* be present in the DOM, hence the try/get name.

	this.tryGetMainSectionElement = function () {
		return this.tryFindByXpath(this.getMainSectionXpath());
	};

	this.tryGetFooterElement = function () {
		return this.tryFindByXpath(this.getFooterSectionXpath());
	};

	this.tryGetClearCompleteButton = function () {
		return this.tryFindByXpath(this.getCompletedButtonXpath());
	};

	this.tryGetToggleForItemAtIndex = function (index) {
		var xpath = this.xPathForItemAtIndex(index) + '//input[contains(@class,"toggle")]';
		return this.tryFindByXpath(xpath);
	};

	this.tryGetItemLabelAtIndex = function (index) {
		return this.tryFindByXpath(this.xPathForItemAtIndex(index) + '//label');
	};

	// ----------------- DOM element access methods

	this.getFocussedElementId = function () {
		return browser.switchTo().activeElement().getAttribute(!idSelectors ? 'id' : 'class');
	};

	this.getEditInputForItemAtIndex = function (index) {
		var xpath = this.xPathForItemAtIndex(index) + '//input[contains(@class,"edit")]';
		return this.findByXpath(xpath);
	};

	this.getItemInputField = function () {
		return this.findByXpath(this.getNewInputXpath());
	};

	this.getMarkAllCompletedCheckBox = function () {
		return this.findByXpath(this.getToggleAllXpath());
	};

	this.getItemElements = function () {
		return this.tryFindByXpath(this.getTodoListXpath() + '/li');
	};

	this.getNonCompletedItemElements = function () {
		return this.tryFindByXpath(this.getTodoListXpath() + '/li[not(contains(@class,"completed"))]');
	};

	this.getItemsCountElement = function () {
		return this.findByXpath(this.getCountXpath());
	};

	this.getItemLabelAtIndex = function (index) {
		return this.findByXpath(this.xPathForItemAtIndex(index) + '//label');
	};

	this.getFilterElements = function () {
		return this.tryFindByXpath(this.getFilterElementsXpath());
	};

	this.getItemLabels = function () {
		var xpath = this.getTodoListXpath() + '/li//label';
		return this.tryFindByXpath(xpath);
	};

	// ----------------- page actions
	this.ensureAppIsVisible = function () {
		return browser.findElements(webdriver.By.css('#todoapp'))
		.then(function (elms) {
			if (elms.length > 0) {
				return true;
			} else {
				return browser.findElements(webdriver.By.css('.todoapp'));
			}
		})
		.then(function (elms) {
			if (elms === true) {
				return true;
			}

			if (elms.length) {
				idSelectors = true;
				return true;
			}

			throw new Error('Unable to find application root, did you start your local server?');
		});
	};

	this.clickMarkAllCompletedCheckBox = function () {
		return this.getMarkAllCompletedCheckBox().then(function (checkbox) {
			checkbox.click();
		});
	};

	this.clickClearCompleteButton = function () {
		return this.tryGetClearCompleteButton().then(function (elements) {
			var button = elements[0];
			button.click();
		});
	};

	this.enterItem = function (itemText) {
		var textField = this.getItemInputField();
		textField.sendKeys(itemText);
		textField.sendKeys(webdriver.Key.ENTER);
	};

	this.toggleItemAtIndex = function (index) {
		return this.tryGetToggleForItemAtIndex(index).then(function (elements) {
			var toggleElement = elements[0];
			toggleElement.click();
		});
	};

	this.editItemAtIndex = function (index, itemText) {
		return this.getEditInputForItemAtIndex(index)
		.then(function (itemEditField) {
			// send 50 delete keypresses, just to be sure the item text is deleted
			var deleteKeyPresses = '';
			for (var i = 0; i < 50; i++) {
				deleteKeyPresses += webdriver.Key.BACK_SPACE;
				deleteKeyPresses += webdriver.Key.DELETE;
			}

			itemEditField.sendKeys(deleteKeyPresses);

			// update the item with the new text.
			itemEditField.sendKeys(itemText);
		});
	};

	this.doubleClickItemAtIndex = function (index) {
		return this.getItemLabelAtIndex(index).then(function (itemLabel) {
			// double click is not 'natively' supported, so we need to send the
			// event direct to the element see:
			// jscs:disable
			// http://stackoverflow.com/questions/3982442/selenium-2-webdriver-how-to-double-click-a-table-row-which-opens-a-new-window
			// jscs:enable
			browser.executeScript('var evt = document.createEvent("MouseEvents");' +
				'evt.initMouseEvent("dblclick",true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0,null);' +
				'arguments[0].dispatchEvent(evt);', itemLabel);
		});
	};

	this.filterByActiveItems = function () {
		return this.getFilterElements().then(function (filters) {
			filters[1].click();
		});
	};

	this.filterByCompletedItems = function () {
		return this.getFilterElements().then(function (filters) {
			filters[2].click();
		});
	};

	this.filterByAllItems = function () {
		return this.getFilterElements().then(function (filters) {
			filters[0].click();
		});
	};
};
