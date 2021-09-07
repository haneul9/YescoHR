//@ui5-bundle sap/ui/yesco/Component-preload.js
jQuery.sap.registerPreloadedModules({
  version: '2.0',
  modules: {
    'sap/ui/yesco/Component.js': function () {
      sap.ui.define(['sap/ui/core/UIComponent', 'sap/ui/Device', './model/models', './controller/ListSelector', './controller/ErrorHandler', 'sap/ui/model/odata/v2/ODataModel'], (t, e, s, o, i, n) => {
        'use strict';
        return t.extend('sap.ui.yesco.Component', {
          metadata: { manifest: 'json' },
          init() {
            this.setModel(s.createDeviceModel(), 'device');
            var e = this.getMetadata().getConfig();
            var a = new n(e.commonLocal);
            this.setModel(a);
            this.oListSelector = new o();
            this._oErrorHandler = new i(this);
            t.prototype.init.apply(this, arguments);
            this.getRouter().initialize();
          },
          destroy() {
            this.oListSelector.destroy();
            this._oErrorHandler.destroy();
            t.prototype.destroy.apply(this, arguments);
          },
          getContentDensityClass() {
            if (!Object.prototype.hasOwnProperty.call(this, '_sContentDensityClass')) {
              if (document.body.classList.contains('sapUiSizeCozy') || document.body.classList.contains('sapUiSizeCompact')) {
                this._sContentDensityClass = '';
              } else if (!e.support.touch) {
                this._sContentDensityClass = 'sapUiSizeCompact';
              } else {
                this._sContentDensityClass = 'sapUiSizeCozy';
              }
            }
            return this._sContentDensityClass;
          },
        });
      });
    },
    'sap/ui/yesco/common/appUtils.js': function () {
      sap.ui.define([], function () {
        'use strict';
        return {
          getDevice() {
            return sap.ui.Device.system.desktop === true ? sap.ui.Device.system.SYSTEMTYPE.DESKTOP : sap.ui.Device.system.phone === true ? sap.ui.Device.system.SYSTEMTYPE.PHONE : sap.ui.Device.system.tablet === true ? sap.ui.Device.system.SYSTEMTYPE.PHONE : '';
          },
          log(...e) {
            setTimeout(function () {
              if (typeof console !== 'undefined' && typeof console.log === 'function') {
                console.log(e);
              }
            }, 0);
          },
        };
      });
    },
    'sap/ui/yesco/control/Placeholder.js': function () {
      sap.ui.define(['sap/ui/core/Control'], function (e) {
        'use strict';
        return e.extend('sap.ui.yesco.control.Placeholder', {
          metadata: { properties: { width: { type: 'sap.ui.core.CSSSize', defaultValue: '200px' }, line: { type: 'int', defaultValue: 5 } }, aggregations: {}, events: {} },
          renderer: function (e, t) {
            e.write('<div');
            e.writeControlData(t);
            e.addClass('ui placeholder');
            e.writeClasses();
            e.addStyle('width', t.getWidth());
            e.writeStyles();
            e.write('>');
            for (let i = 0; i < t.getLine(); i++) {
              e.write('<div');
              e.addClass('line');
              e.writeClasses();
              e.write('>');
              e.write('</div>');
            }
            e.write('</div>');
          },
        });
      });
    },
    'sap/ui/yesco/controller/App.controller.js': function () {
      sap.ui.define(['sap/ui/model/json/JSONModel', 'sap/ui/yesco/common/appUtils', 'sap/ui/yesco/controller/BaseController', 'sap/ui/yesco/extension/lodash', 'sap/ui/yesco/extension/moment'], (e, t, o, a, s) => {
        'use strict';
        return o.extend('sap.ui.yesco.controller.App', {
          onInit() {
            const o = moment();
            this.debug(o);
            this.debug('lodash');
            this.debug(_.join(['1', '2', '3'], '~'));
            this.debug('lodash');
            this.debug(t.getDevice());
            const a = this.getView().getBusyIndicatorDelay();
            const s = new e({ busy: false, delay: 0, layout: 'OneColumn', previousLayout: '', actionButtonsInfo: { midColumn: { fullScreen: false } } });
            this.setModel(s, 'appView');
            const n = function () {
              s.setProperty('/busy', false);
              s.setProperty('/delay', a);
            };
            this.getOwnerComponent().getModel().metadataLoaded().then(n);
            this.getOwnerComponent().getModel().attachMetadataFailed(n);
            this.getView().addStyleClass(this.getOwnerComponent().getContentDensityClass());
          },
          onHomePress() {
            this.getRouter().navTo('appHome');
          },
          onSelectTab(e) {
            const t = e.getParameter('item');
          },
          navigateTo(e) {},
          navigateToHome(e) {
            this.getRouter().navTo('appHome');
          },
          navigateToCarousel(e) {
            this.getRouter().navTo('carousel');
          },
          navigateToPage1(e) {
            this.getRouter().navTo('page1');
          },
          navigateToPage2(e) {
            this.getRouter().navTo('page2');
          },
          navigateToUserForm(e) {
            this.getRouter().navTo('userform');
          },
          navigateToAppConfig(e) {
            this.getRouter().navTo('appconfig');
          },
          navigateToRouting(e) {
            this.getRouter().navTo('page1');
          },
          onUserNamePress() {},
        });
      });
    },
    'sap/ui/yesco/controller/BaseController.js': function () {
      sap.ui.define(['sap/base/Log', 'sap/ui/core/mvc/Controller', 'sap/ui/core/routing/History', 'sap/ui/core/UIComponent'], (e, t, o, r) => {
        'use strict';
        return t.extend('sap.ui.yesco.controller.BaseController', {
          getRouter() {
            return r.getRouterFor(this);
          },
          getModel(e) {
            return this.getView().getModel(e);
          },
          setModel(e, t) {
            return this.getView().setModel(e, t);
          },
          getResourceBundle() {
            return this.getOwnerComponent().getModel('i18n').getResourceBundle();
          },
          onNavBack() {
            const e = o.getInstance().getPreviousHash();
            if (e) {
              history.go(-1);
            } else {
              this.getRouter().navTo('appHome', {}, true);
            }
          },
          onDisplayNotFound() {
            this.getRouter().getTargets().display('notFound', { fromTarget: 'home' });
          },
          debug(...e) {
            setTimeout(() => console.log(...e), 0);
          },
        });
      });
    },
    'sap/ui/yesco/controller/Carousel.controller.js': function () {
      sap.ui.define(['./BaseController'], (e) => {
        'use strict';
        return e.extend('sap.ui.yesco.controller.Carousel', { onInit() {} });
      });
    },
    'sap/ui/yesco/controller/Detail.controller.js': function () {
      sap.ui.define(['sap/m/library', 'sap/ui/model/json/JSONModel', '../model/formatter', './BaseController'], (e, t, o, s) => {
        'use strict';
        const n = e.URLHelper;
        return s.extend('sap.ui.yesco.controller.Detail', {
          formatter: o,
          onInit() {
            const e = new t({ busy: false, delay: 0 });
            this.getRouter().getRoute('object').attachPatternMatched(this._onObjectMatched, this);
            this.setModel(e, 'detailView');
            this.getOwnerComponent().getModel().metadataLoaded().then(this._onMetadataLoaded.bind(this));
          },
          onSendEmailPress() {
            const e = this.getModel('detailView');
            n.triggerEmail(null, e.getProperty('/shareSendEmailSubject'), e.getProperty('/shareSendEmailMessage'));
          },
          _onObjectMatched(e) {
            const t = e.getParameter('arguments').objectId;
            this.getModel('appView').setProperty('/layout', 'TwoColumnsMidExpanded');
            this.getModel()
              .metadataLoaded()
              .then(() => {
                var e = this.getModel().createKey('Products', { ProductID: t });
                this._bindView('/' + e);
              });
          },
          _bindView(e) {
            const t = this.getModel('detailView');
            t.setProperty('/busy', false);
            this.getView().bindElement({
              path: e,
              events: {
                change: this._onBindingChange.bind(this),
                dataRequested() {
                  t.setProperty('/busy', true);
                },
                dataReceived() {
                  t.setProperty('/busy', false);
                },
              },
            });
          },
          _onBindingChange() {
            const e = this.getView();
            const t = e.getElementBinding();
            if (!t.getBoundContext()) {
              this.getRouter().getTargets().display('detailObjectNotFound');
              this.getOwnerComponent().oListSelector.clearMasterListSelection();
              return;
            }
            const o = t.getPath();
            const s = this.getResourceBundle();
            const n = e.getModel().getObject(o);
            const r = n.ProductID;
            const a = n.ProductName;
            const i = this.getModel('detailView');
            this.getOwnerComponent().oListSelector.selectAListItem(o);
            i.setProperty('/shareSendEmailSubject', s.getText('shareSendEmailObjectSubject', [r]));
            i.setProperty('/shareSendEmailMessage', s.getText('shareSendEmailObjectMessage', [a, r, location.href]));
          },
          _onMetadataLoaded() {
            const e = this.getView().getBusyIndicatorDelay();
            const t = this.getModel('detailView');
            t.setProperty('/delay', 0);
            t.setProperty('/busy', true);
            t.setProperty('/delay', e);
          },
          onCloseDetailPress() {
            this.getModel('appView').setProperty('/actionButtonsInfo/midColumn/fullScreen', false);
            this.getOwnerComponent().oListSelector.clearMasterListSelection();
            this.getRouter().navTo('master');
          },
          toggleFullScreen() {
            const e = this.getModel('appView');
            const t = e.getProperty('/actionButtonsInfo/midColumn/fullScreen');
            e.setProperty('/actionButtonsInfo/midColumn/fullScreen', !t);
            if (!t) {
              e.setProperty('/previousLayout', e.getProperty('/layout'));
              e.setProperty('/layout', 'MidColumnFullScreen');
            } else {
              e.setProperty('/layout', e.getProperty('/previousLayout'));
            }
          },
        });
      });
    },
    'sap/ui/yesco/controller/DetailNotFound.controller.js': function () {
      sap.ui.define(['./BaseController'], (e) => {
        'use strict';
        return e.extend('sap.ui.yesco.controller.DetailNotFound', {});
      });
    },
    'sap/ui/yesco/controller/ErrorHandler.js': function () {
      sap.ui.define(['sap/m/MessageBox', 'sap/ui/base/Object'], (e, s) => {
        'use strict';
        return s.extend('sap.ui.yesco.controller.ErrorHandler', {
          constructor: function (e) {
            this._oResourceBundle = e.getModel('i18n').getResourceBundle();
            this._oComponent = e;
            this._oModel = e.getModel();
            this._bMessageOpen = false;
            this._sErrorText = this._oResourceBundle.getText('errorText');
            this._oModel.attachMetadataFailed((e) => {
              const s = e.getParameters();
              this._showServiceError(s.response);
            }, this);
            this._oModel.attachRequestFailed((e) => {
              const s = e.getParameters();
              if (s.response.statusCode !== '404' || (s.response.statusCode === 404 && s.response.responseText.indexOf('Cannot POST') === 0)) {
                this._showServiceError(s.response);
              }
            }, this);
          },
          _showServiceError(s) {
            if (this._bMessageOpen) {
              return;
            }
            this._bMessageOpen = true;
            e.error(this._sErrorText, {
              id: 'serviceErrorMessageBox',
              details: s,
              styleClass: this._oComponent.getContentDensityClass(),
              actions: [e.Action.CLOSE],
              onClose: () => {
                this._bMessageOpen = false;
              },
            });
          },
        });
      });
    },
    'sap/ui/yesco/controller/Home.controller.js': function () {
      sap.ui.define(['sap/ui/yesco/controller/BaseController', 'sap/ui/model/Filter', 'sap/ui/model/FilterOperator'], (e, o, t) => {
        'use strict';
        return e.extend('sap.ui.yesco.controller.Home', {
          onInit() {
            const e = this.getOwnerComponent().getModel();
            e.read('/EmpLoginInfoSet', {
              filters: [new o('Pernr', t.EQ, '1')],
              success: (e, o) => {
                this.debug(e, o);
              },
              error: (e) => {
                this.debug(e);
              },
            });
          },
          onNavToEmployees() {
            this.getRouter().navTo('employeeList');
          },
        });
      });
    },
    'sap/ui/yesco/controller/ListSelector.js': function () {
      sap.ui.define(['sap/base/Log', 'sap/ui/base/Object'], (e, t) => {
        'use strict';
        return t.extend('sap.ui.yesco.controller.ListSelector', {
          constructor: function () {
            this._oWhenListHasBeenSet = new Promise((e) => {
              this._fnResolveListHasBeenSet = e;
            });
            this.oWhenListLoadingIsDone = new Promise((e, t) => {
              this._oWhenListHasBeenSet.then((s) => {
                const i = s.getBinding('items');
                if (!i) {
                  return;
                }
                i.attachEventOnce('dataReceived', () => {
                  if (this._oList.getItems().length) {
                    e({ list: s });
                  } else {
                    t({ list: s });
                  }
                });
              });
            });
          },
          setBoundMasterList(e) {
            this._oList = e;
            this._fnResolveListHasBeenSet(e);
          },
          selectAListItem(t) {
            this.oWhenListLoadingIsDone.then(
              () => {
                const e = this._oList;
                let s;
                if (e.getMode() === 'None') {
                  return;
                }
                s = e.getSelectedItem();
                if (s && s.getBindingContext().getPath() === t) {
                  return;
                }
                e.getItems().some((s) => {
                  if (s.getBindingContext() && s.getBindingContext().getPath() === t) {
                    e.setSelectedItem(s);
                    return true;
                  }
                });
              },
              () => {
                e.warning('Could not select the list item with the path' + t + ' because the list encountered an error or had no items');
              }
            );
          },
          clearMasterListSelection() {
            this._oWhenListHasBeenSet.then(() => {
              this._oList.removeSelections(true);
            });
          },
        });
      });
    },
    'sap/ui/yesco/controller/Master.controller.js': function () {
      sap.ui.define(['sap/m/GroupHeaderListItem', 'sap/ui/Device', 'sap/ui/core/Fragment', 'sap/ui/model/Filter', 'sap/ui/model/FilterOperator', 'sap/ui/model/Sorter', 'sap/ui/model/json/JSONModel', '../model/formatter', './BaseController'], (e, t, s, i, r, o, a, n, l) => {
        'use strict';
        return l.extend('sap.ui.yesco.controller.Master', {
          formatter: n,
          onInit() {
            const e = this.byId('list');
            const t = this._createViewModel();
            const s = e.getBusyIndicatorDelay();
            this._oGroupFunctions = {
              UnitPrice(e) {
                const t = this.getResourceBundle();
                const s = e.getProperty('UnitPrice');
                let i;
                let r;
                if (s <= 20) {
                  i = 'LE20';
                  r = t.getText('masterGroup1Header1');
                } else {
                  i = 'GT20';
                  r = t.getText('masterGroup1Header2');
                }
                return { key: i, text: r };
              },
            };
            this._oList = e;
            this._oListFilterState = { aFilter: [], aSearch: [] };
            this.setModel(t, 'masterView');
            e.attachEventOnce('updateFinished', function () {
              t.setProperty('/delay', s);
            });
            this.getView().addEventDelegate({
              onBeforeFirstShow: () => {
                this.getOwnerComponent().oListSelector.setBoundMasterList(e);
              },
            });
            this.getRouter().getRoute('master').attachPatternMatched(this._onMasterMatched, this);
            this.getRouter().attachBypassed(this.onBypassed, this);
          },
          onUpdateFinished(e) {
            this._updateListItemCount(e.getParameter('total'));
          },
          onSearch(e) {
            if (e.getParameters().refreshButtonPressed) {
              this.onRefresh();
              return;
            }
            const t = e.getParameter('query');
            if (t) {
              this._oListFilterState.aSearch = [new i('ProductName', r.Contains, t)];
            } else {
              this._oListFilterState.aSearch = [];
            }
            this._applyFilterSearch();
          },
          onRefresh() {
            this._oList.getBinding('items').refresh();
          },
          onOpenViewSettings(e) {
            let t = 'filter';
            if (e.getSource() instanceof sap.m.Button) {
              const s = e.getSource().getId();
              if (s.match('sort')) {
                t = 'sort';
              } else if (s.match('group')) {
                t = 'group';
              }
            }
            if (!this.byId('viewSettingsDialog')) {
              s.load({ id: this.getView().getId(), name: 'sap.ui.yesco.view.ViewSettingsDialog', controller: this }).then((e) => {
                this.getView().addDependent(e);
                e.addStyleClass(this.getOwnerComponent().getContentDensityClass());
                e.open(t);
              });
            } else {
              this.byId('viewSettingsDialog').open(t);
            }
          },
          onConfirmViewSettingsDialog(e) {
            const t = e.getParameters().filterItems;
            const s = [];
            const o = [];
            t.forEach((e) => {
              switch (e.getKey()) {
                case 'Filter1': {
                  s.push(new i('UnitPrice', r.LE, 100));
                  break;
                }
                case 'Filter2': {
                  s.push(new i('UnitPrice', r.GT, 100));
                  break;
                }
                default: {
                  break;
                }
              }
              o.push(e.getText());
            });
            this._oListFilterState.aFilter = s;
            this._updateFilterBar(o.join(', '));
            this._applyFilterSearch();
            this._applySortGroup(e);
          },
          _applySortGroup(e) {
            const t = e.getParameters();
            const s = [];
            let i;
            let r;
            if (t.groupItem) {
              i = t.groupItem.getKey();
              r = t.groupDescending;
              s.push(new o(i, r, this._oGroupFunctions[i]));
            } else {
              i = t.sortItem.getKey();
              r = t.sortDescending;
              s.push(new o(i, r));
            }
            this._oList.getBinding('items').sort(s);
          },
          onSelectionChange(e) {
            const t = e.getSource();
            const s = e.getParameter('selected');
            if (!(t.getMode() === 'MultiSelect' && !s)) {
              this._showDetail(e.getParameter('listItem') || e.getSource());
            }
          },
          onBypassed() {
            this._oList.removeSelections(true);
          },
          createGroupHeader(t) {
            return new e({ title: t.text, upperCase: false });
          },
          onNavBack() {
            history.go(-1);
          },
          _createViewModel() {
            const e = this.getResourceBundle();
            return new a({ isFilterBarVisible: false, filterBarLabel: '', delay: 0, title: e.getText('masterTitleCount', [0]), noDataText: e.getText('masterListNoDataText'), sortBy: 'ProductName', groupBy: 'None' });
          },
          _onMasterMatched() {
            this.getModel('appView').setProperty('/layout', 'OneColumn');
          },
          _showDetail(e) {
            const s = !t.system.phone;
            this.getModel('appView').setProperty('/layout', 'TwoColumnsMidExpanded');
            this.getRouter().navTo('object', { objectId: e.getBindingContext().getProperty('ProductID') }, s);
          },
          _updateListItemCount(e) {
            if (this._oList.getBinding('items').isLengthFinal()) {
              const t = this.getResourceBundle().getText('masterTitleCount', [e]);
              this.getModel('masterView').setProperty('/title', t);
            }
          },
          _applyFilterSearch() {
            const e = this._oListFilterState.aSearch.concat(this._oListFilterState.aFilter);
            const t = this.getModel('masterView');
            this._oList.getBinding('items').filter(e, 'Application');
            if (e.length !== 0) {
              t.setProperty('/noDataText', this.getResourceBundle().getText('masterListNoDataWithFilterOrSearchText'));
            } else if (this._oListFilterState.aSearch.length > 0) {
              t.setProperty('/noDataText', this.getResourceBundle().getText('masterListNoDataText'));
            }
          },
          _updateFilterBar(e) {
            const t = this.getModel('masterView');
            t.setProperty('/isFilterBarVisible', this._oListFilterState.aFilter.length > 0);
            t.setProperty('/filterBarLabel', this.getResourceBundle().getText('masterFilterBarText', [e]));
          },
        });
      });
    },
    'sap/ui/yesco/controller/NotFound.controller.js': function () {
      sap.ui.define(['sap/ui/yesco/controller/BaseController'], (t) => {
        'use strict';
        return t.extend('sap.ui.yesco.controller.NotFound', {
          onInit() {
            this.getRouter().getTarget('notFound').attachDisplay(this._onNotFoundDisplayed, this);
          },
          _onNotFoundDisplayed(t) {
            this._oData = t.getParameter('data');
            this.getModel('appView').setProperty('/layout', 'OneColumn');
          },
          onNavBack() {
            if (this._oData && this._oData.fromTarget) {
              this.getRouter().getTargets().display(this._oData.fromTarget);
              delete this._oData.fromTarget;
              return;
            }
            t.prototype.onNavBack.apply(this, arguments);
          },
        });
      });
    },
    'sap/ui/yesco/controller/employee/EmployeeList.controller.js': function () {
      sap.ui.define(['sap/ui/yesco/controller/BaseController'], (e) => {
        'use strict';
        return e.extend('sap.ui.yesco.controller.employee.EmployeeList', {});
      });
    },
    'sap/ui/yesco/i18n/i18n.properties':
      '# This is the resource bundle for Products\r\n# __ldi.translation.uuid=\r\n\r\n#XTIT: Application name\r\nappTitle=Home\r\n\r\n#YDES: Application description\r\nappDescription=yesco eHR Home\r\n\r\nShowEmployeeList=\\uc9c1\\uc6d0 \\ubaa9\\ub85d \\ubcf4\\uae30\r\nEmployeeList=\\uc9c1\\uc6d0 \\ubaa9\\ub85d\r\nListOfAllEmployees=\\uc804\\uccb4 \\uc9c1\\uc6d0 \\ubaa9\\ub85d\r\n\r\n#~~~ Master View ~~~~~~~~~~~~~~~~~~~~~~~~~~\r\n\r\n#XTIT: Master view title with placeholder for the number of items\r\nmasterTitleCount=<Products> ({0})\r\n\r\n#XTOL: Tooltip for the search field\r\nmasterSearchTooltip=Enter an <Products> name or a part of it.\r\n\r\n#XBLI: text for a list with no data\r\nmasterListNoDataText=No <ProductsPlural> are currently available\r\n\r\n#XBLI: text for a list with no data with filter or search\r\nmasterListNoDataWithFilterOrSearchText=No matching <ProductsPlural> found\r\n\r\n#XSEL: Option to sort the master list by ProductName\r\nmasterSort1=Sort By <ProductName>\r\n\r\n#XSEL: Option to sort the master list by UnitPrice\r\nmasterSort2=Sort By <UnitPrice>\r\n\r\n#XSEL: Option to filter the master list by UnitPrice\r\nmasterFilterName=<UnitPrice>\r\n\r\n#XSEL: Option to not filter the master list\r\nmasterFilterNone=none\r\n\r\n\r\n#XSEL: Option to filter the master list by  if the value is less than 100\r\nmasterFilter1=<100 \r\n\r\n#XSEL: Option to filter the master list by  if the value is greater than 100\r\nmasterFilter2=>100 \r\n\r\n#YMSG: Filter text that is displayed above the master list\r\nmasterFilterBarText=Filtered by {0}\r\n\r\n#XSEL: Option to not group the master list\r\nmasterGroupNone=(Not grouped)\r\n\r\n#XSEL: Option to group the master list by UnitPrice\r\nmasterGroup1=<UnitPrice> Group\r\n\r\n#XGRP: Group header UnitPrice\r\nmasterGroup1Header1=<UnitPrice> 20 or less\r\n\r\n#XGRP: Group header UnitPrice\r\nmasterGroup1Header2=<UnitPrice> higher than 20\r\n\r\n#~~~ Detail View ~~~~~~~~~~~~~~~~~~~~~~~~~~\r\n\r\n#XTOL: Icon Tab Bar Info\r\ndetailIconTabBarInfo=Info\r\n\r\n#XTOL: Icon Tab Bar Attachments\r\ndetailIconTabBarAttachments=Attachments\r\n\r\n#XTOL: Tooltip text for close column button\r\ncloseColumn=Close\r\n\r\n#XTIT: Send E-Mail subject\r\nshareSendEmailObjectSubject=<Email subject including object identifier PLEASE REPLACE ACCORDING TO YOUR USE CASE> {0}\r\n\r\n#YMSG: Send E-Mail message\r\nshareSendEmailObjectMessage=<Email body PLEASE REPLACE ACCORDING TO YOUR USE CASE> {0} (id: {1})\\r\\n{2}\r\n\r\n#XBUT: Text for the send e-mail button\r\nsendEmail=Send E-Mail\r\n\r\n#XTIT: Title text for the price\r\npriceTitle=Price\r\n\r\n#~~~ Not Found View ~~~~~~~~~~~~~~~~~~~~~~~\r\n\r\n#XTIT: Not found view title\r\nnotFoundTitle=Not Found\r\n\r\n#YMSG: The Products not found text is displayed when there is no Products with this id\r\nnoObjectFoundText=This <Products> is not available\r\n\r\n#YMSG: The not found text is displayed when there was an error loading the resource (404 error)\r\nnotFoundText=The requested resource was not found\r\n\r\nnotFoundDescription=\r\n\r\n#~~~ Not Available View ~~~~~~~~~~~~~~~~~~~~~~~\r\n\r\n#XTIT: Master view title\r\nnotAvailableViewTitle=<Products>\r\n\r\n#~~~ Error Handling ~~~~~~~~~~~~~~~~~~~~~~~\r\n\r\n#YMSG: Error dialog description\r\nerrorText=Sorry, a technical error occurred! Please try again later.\r\n\r\n# Detail Page\r\ndetailPageTitle=Walkthrough - Details\r\nratingConfirmation=You have rated this product with {0} stars\r\n\r\n# Product Rating\r\nproductRatingLabelInitial=Please rate this product\r\nproductRatingLabelIndicator=Your rating: {0} out of {1}\r\nproductRatingLabelFinal=Thank you!\r\nproductRatingButton=Rate',
    'sap/ui/yesco/i18n/i18n_en.properties':
      '# This is the resource bundle for Products\r\n# __ldi.translation.uuid=\r\n\r\n#XTIT: Application name\r\nappTitle=Home\r\n\r\n#YDES: Application description\r\nappDescription=yesco eHR Home\r\n\r\nShowEmployeeList=Show Employee List\r\nEmployeeList=Employee List\r\nListOfAllEmployees=List of all employees\r\n\r\n#~~~ Master View ~~~~~~~~~~~~~~~~~~~~~~~~~~\r\n\r\n#XTIT: Master view title with placeholder for the number of items\r\nmasterTitleCount=<Products> ({0})\r\n\r\n#XTOL: Tooltip for the search field\r\nmasterSearchTooltip=Enter an <Products> name or a part of it.\r\n\r\n#XBLI: text for a list with no data\r\nmasterListNoDataText=No <ProductsPlural> are currently available\r\n\r\n#XBLI: text for a list with no data with filter or search\r\nmasterListNoDataWithFilterOrSearchText=No matching <ProductsPlural> found\r\n\r\n#XSEL: Option to sort the master list by ProductName\r\nmasterSort1=Sort By <ProductName>\r\n\r\n#XSEL: Option to sort the master list by UnitPrice\r\nmasterSort2=Sort By <UnitPrice>\r\n\r\n#XSEL: Option to filter the master list by UnitPrice\r\nmasterFilterName=<UnitPrice>\r\n\r\n#XSEL: Option to not filter the master list\r\nmasterFilterNone=none\r\n\r\n\r\n#XSEL: Option to filter the master list by  if the value is less than 100\r\nmasterFilter1=<100 \r\n\r\n#XSEL: Option to filter the master list by  if the value is greater than 100\r\nmasterFilter2=>100 \r\n\r\n#YMSG: Filter text that is displayed above the master list\r\nmasterFilterBarText=Filtered by {0}\r\n\r\n#XSEL: Option to not group the master list\r\nmasterGroupNone=(Not grouped)\r\n\r\n#XSEL: Option to group the master list by UnitPrice\r\nmasterGroup1=<UnitPrice> Group\r\n\r\n#XGRP: Group header UnitPrice\r\nmasterGroup1Header1=<UnitPrice> 20 or less\r\n\r\n#XGRP: Group header UnitPrice\r\nmasterGroup1Header2=<UnitPrice> higher than 20\r\n\r\n#~~~ Detail View ~~~~~~~~~~~~~~~~~~~~~~~~~~\r\n\r\n#XTOL: Icon Tab Bar Info\r\ndetailIconTabBarInfo=Info\r\n\r\n#XTOL: Icon Tab Bar Attachments\r\ndetailIconTabBarAttachments=Attachments\r\n\r\n#XTOL: Tooltip text for close column button\r\ncloseColumn=Close\r\n\r\n#XTIT: Send E-Mail subject\r\nshareSendEmailObjectSubject=<Email subject including object identifier PLEASE REPLACE ACCORDING TO YOUR USE CASE> {0}\r\n\r\n#YMSG: Send E-Mail message\r\nshareSendEmailObjectMessage=<Email body PLEASE REPLACE ACCORDING TO YOUR USE CASE> {0} (id: {1})\\r\\n{2}\r\n\r\n#XBUT: Text for the send e-mail button\r\nsendEmail=Send E-Mail\r\n\r\n#XTIT: Title text for the price\r\npriceTitle=Price\r\n\r\n#~~~ Not Found View ~~~~~~~~~~~~~~~~~~~~~~~\r\n\r\n#XTIT: Not found view title\r\nnotFoundTitle=Not Found\r\n\r\n#YMSG: The Products not found text is displayed when there is no Products with this id\r\nnoObjectFoundText=This <Products> is not available\r\n\r\n#YMSG: The not found text is displayed when there was an error loading the resource (404 error)\r\nnotFoundText=The requested resource was not found\r\n\r\nnotFoundDescription=\r\n\r\n#~~~ Not Available View ~~~~~~~~~~~~~~~~~~~~~~~\r\n\r\n#XTIT: Master view title\r\nnotAvailableViewTitle=<Products>\r\n\r\n#~~~ Error Handling ~~~~~~~~~~~~~~~~~~~~~~~\r\n\r\n#YMSG: Error dialog description\r\nerrorText=Sorry, a technical error occurred! Please try again later.\r\n\r\n# Detail Page\r\ndetailPageTitle=Walkthrough - Details\r\nratingConfirmation=You have rated this product with {0} stars\r\n\r\n# Product Rating\r\nproductRatingLabelInitial=Please rate this product\r\nproductRatingLabelIndicator=Your rating: {0} out of {1}\r\nproductRatingLabelFinal=Thank you!\r\nproductRatingButton=Rate',
    'sap/ui/yesco/i18n/i18n_ko.properties':
      '# This is the resource bundle for Products\r\n# __ldi.translation.uuid=\r\n\r\n#XTIT: Application name\r\nappTitle=Home\r\n\r\n#YDES: Application description\r\nappDescription=yesco eHR Home\r\n\r\nShowEmployeeList=\\uc9c1\\uc6d0 \\ubaa9\\ub85d \\ubcf4\\uae30\r\nEmployeeList=\\uc9c1\\uc6d0 \\ubaa9\\ub85d\r\nListOfAllEmployees=\\uc804\\uccb4 \\uc9c1\\uc6d0 \\ubaa9\\ub85d\r\n\r\n#~~~ Master View ~~~~~~~~~~~~~~~~~~~~~~~~~~\r\n\r\n#XTIT: Master view title with placeholder for the number of items\r\nmasterTitleCount=<Products> ({0})\r\n\r\n#XTOL: Tooltip for the search field\r\nmasterSearchTooltip=Enter an <Products> name or a part of it.\r\n\r\n#XBLI: text for a list with no data\r\nmasterListNoDataText=No <ProductsPlural> are currently available\r\n\r\n#XBLI: text for a list with no data with filter or search\r\nmasterListNoDataWithFilterOrSearchText=No matching <ProductsPlural> found\r\n\r\n#XSEL: Option to sort the master list by ProductName\r\nmasterSort1=Sort By <ProductName>\r\n\r\n#XSEL: Option to sort the master list by UnitPrice\r\nmasterSort2=Sort By <UnitPrice>\r\n\r\n#XSEL: Option to filter the master list by UnitPrice\r\nmasterFilterName=<UnitPrice>\r\n\r\n#XSEL: Option to not filter the master list\r\nmasterFilterNone=none\r\n\r\n\r\n#XSEL: Option to filter the master list by  if the value is less than 100\r\nmasterFilter1=<100 \r\n\r\n#XSEL: Option to filter the master list by  if the value is greater than 100\r\nmasterFilter2=>100 \r\n\r\n#YMSG: Filter text that is displayed above the master list\r\nmasterFilterBarText=Filtered by {0}\r\n\r\n#XSEL: Option to not group the master list\r\nmasterGroupNone=(Not grouped)\r\n\r\n#XSEL: Option to group the master list by UnitPrice\r\nmasterGroup1=<UnitPrice> Group\r\n\r\n#XGRP: Group header UnitPrice\r\nmasterGroup1Header1=<UnitPrice> 20 or less\r\n\r\n#XGRP: Group header UnitPrice\r\nmasterGroup1Header2=<UnitPrice> higher than 20\r\n\r\n#~~~ Detail View ~~~~~~~~~~~~~~~~~~~~~~~~~~\r\n\r\n#XTOL: Icon Tab Bar Info\r\ndetailIconTabBarInfo=Info\r\n\r\n#XTOL: Icon Tab Bar Attachments\r\ndetailIconTabBarAttachments=Attachments\r\n\r\n#XTOL: Tooltip text for close column button\r\ncloseColumn=Close\r\n\r\n#XTIT: Send E-Mail subject\r\nshareSendEmailObjectSubject=<Email subject including object identifier PLEASE REPLACE ACCORDING TO YOUR USE CASE> {0}\r\n\r\n#YMSG: Send E-Mail message\r\nshareSendEmailObjectMessage=<Email body PLEASE REPLACE ACCORDING TO YOUR USE CASE> {0} (id: {1})\\r\\n{2}\r\n\r\n#XBUT: Text for the send e-mail button\r\nsendEmail=Send E-Mail\r\n\r\n#XTIT: Title text for the price\r\npriceTitle=Price\r\n\r\n#~~~ Not Found View ~~~~~~~~~~~~~~~~~~~~~~~\r\n\r\n#XTIT: Not found view title\r\nnotFoundTitle=Not Found\r\n\r\n#YMSG: The Products not found text is displayed when there is no Products with this id\r\nnoObjectFoundText=This <Products> is not available\r\n\r\n#YMSG: The not found text is displayed when there was an error loading the resource (404 error)\r\nnotFoundText=The requested resource was not found\r\n\r\nnotFoundDescription=\r\n\r\n#~~~ Not Available View ~~~~~~~~~~~~~~~~~~~~~~~\r\n\r\n#XTIT: Master view title\r\nnotAvailableViewTitle=<Products>\r\n\r\n#~~~ Error Handling ~~~~~~~~~~~~~~~~~~~~~~~\r\n\r\n#YMSG: Error dialog description\r\nerrorText=Sorry, a technical error occurred! Please try again later.\r\n\r\n# Detail Page\r\ndetailPageTitle=Walkthrough - Details\r\nratingConfirmation=You have rated this product with {0} stars\r\n\r\n# Product Rating\r\nproductRatingLabelInitial=Please rate this product\r\nproductRatingLabelIndicator=Your rating: {0} out of {1}\r\nproductRatingLabelFinal=Thank you!\r\nproductRatingButton=Rate',
    'sap/ui/yesco/initMockServer.js': function () {
      sap.ui.define(['sap/ui/yesco/localService/mockserver', 'sap/m/MessageBox'], (e, s) => {
        'use strict';
        e.init()
          .catch((e) => {
            s.error(e.message);
          })
          .finally(() => {
            sap.ui.require(['sap/ui/core/ComponentSupport']);
          });
      });
    },
    'sap/ui/yesco/libs/lodash.js': function () {
      /**
       * @license
       * Lodash lodash.com/license | Underscore.js 1.8.3 underscorejs.org/LICENSE
       */
      (function () {
        function t(t, n, r) {
          switch (r.length) {
            case 0:
              return t.call(n);
            case 1:
              return t.call(n, r[0]);
            case 2:
              return t.call(n, r[0], r[1]);
            case 3:
              return t.call(n, r[0], r[1], r[2]);
          }
          return t.apply(n, r);
        }
        function n(t, n, r, e) {
          for (var u = -1, i = null == t ? 0 : t.length; ++u < i; ) {
            var o = t[u];
            n(e, o, r(o), t);
          }
          return e;
        }
        function r(t, n) {
          for (var r = -1, e = null == t ? 0 : t.length; ++r < e && false !== n(t[r], r, t); );
          return t;
        }
        function e(t, n) {
          for (var r = null == t ? 0 : t.length; r-- && false !== n(t[r], r, t); );
          return t;
        }
        function u(t, n) {
          for (var r = -1, e = null == t ? 0 : t.length; ++r < e; ) if (!n(t[r], r, t)) return false;
          return true;
        }
        function i(t, n) {
          for (var r = -1, e = null == t ? 0 : t.length, u = 0, i = []; ++r < e; ) {
            var o = t[r];
            n(o, r, t) && (i[u++] = o);
          }
          return i;
        }
        function o(t, n) {
          return !(null == t || !t.length) && -1 < v(t, n, 0);
        }
        function f(t, n, r) {
          for (var e = -1, u = null == t ? 0 : t.length; ++e < u; ) if (r(n, t[e])) return true;
          return false;
        }
        function c(t, n) {
          for (var r = -1, e = null == t ? 0 : t.length, u = Array(e); ++r < e; ) u[r] = n(t[r], r, t);
          return u;
        }
        function a(t, n) {
          for (var r = -1, e = n.length, u = t.length; ++r < e; ) t[u + r] = n[r];
          return t;
        }
        function l(t, n, r, e) {
          var u = -1,
            i = null == t ? 0 : t.length;
          for (e && i && (r = t[++u]); ++u < i; ) r = n(r, t[u], u, t);
          return r;
        }
        function s(t, n, r, e) {
          var u = null == t ? 0 : t.length;
          for (e && u && (r = t[--u]); u--; ) r = n(r, t[u], u, t);
          return r;
        }
        function h(t, n) {
          for (var r = -1, e = null == t ? 0 : t.length; ++r < e; ) if (n(t[r], r, t)) return true;
          return false;
        }
        function p(t, n, r) {
          var e;
          return (
            r(t, function (t, r, u) {
              if (n(t, r, u)) return (e = r), false;
            }),
            e
          );
        }
        function _(t, n, r, e) {
          var u = t.length;
          for (r += e ? 1 : -1; e ? r-- : ++r < u; ) if (n(t[r], r, t)) return r;
          return -1;
        }
        function v(t, n, r) {
          if (n === n)
            t: {
              --r;
              for (var e = t.length; ++r < e; )
                if (t[r] === n) {
                  t = r;
                  break t;
                }
              t = -1;
            }
          else t = _(t, d, r);
          return t;
        }
        function g(t, n, r, e) {
          --r;
          for (var u = t.length; ++r < u; ) if (e(t[r], n)) return r;
          return -1;
        }
        function d(t) {
          return t !== t;
        }
        function y(t, n) {
          var r = null == t ? 0 : t.length;
          return r ? m(t, n) / r : F;
        }
        function b(t) {
          return function (n) {
            return null == n ? T : n[t];
          };
        }
        function x(t) {
          return function (n) {
            return null == t ? T : t[n];
          };
        }
        function j(t, n, r, e, u) {
          return (
            u(t, function (t, u, i) {
              r = e ? ((e = false), t) : n(r, t, u, i);
            }),
            r
          );
        }
        function w(t, n) {
          var r = t.length;
          for (t.sort(n); r--; ) t[r] = t[r].c;
          return t;
        }
        function m(t, n) {
          for (var r, e = -1, u = t.length; ++e < u; ) {
            var i = n(t[e]);
            i !== T && (r = r === T ? i : r + i);
          }
          return r;
        }
        function A(t, n) {
          for (var r = -1, e = Array(t); ++r < t; ) e[r] = n(r);
          return e;
        }
        function E(t, n) {
          return c(n, function (n) {
            return [n, t[n]];
          });
        }
        function k(t) {
          return function (n) {
            return t(n);
          };
        }
        function S(t, n) {
          return c(n, function (n) {
            return t[n];
          });
        }
        function O(t, n) {
          return t.has(n);
        }
        function I(t, n) {
          for (var r = -1, e = t.length; ++r < e && -1 < v(n, t[r], 0); );
          return r;
        }
        function R(t, n) {
          for (var r = t.length; r-- && -1 < v(n, t[r], 0); );
          return r;
        }
        function z(t) {
          return '\\' + Lt[t];
        }
        function W(t) {
          var n = -1,
            r = Array(t.size);
          return (
            t.forEach(function (t, e) {
              r[++n] = [e, t];
            }),
            r
          );
        }
        function B(t, n) {
          return function (r) {
            return t(n(r));
          };
        }
        function L(t, n) {
          for (var r = -1, e = t.length, u = 0, i = []; ++r < e; ) {
            var o = t[r];
            (o !== n && '__lodash_placeholder__' !== o) || ((t[r] = '__lodash_placeholder__'), (i[u++] = r));
          }
          return i;
        }
        function U(t) {
          var n = -1,
            r = Array(t.size);
          return (
            t.forEach(function (t) {
              r[++n] = t;
            }),
            r
          );
        }
        function C(t) {
          var n = -1,
            r = Array(t.size);
          return (
            t.forEach(function (t) {
              r[++n] = [t, t];
            }),
            r
          );
        }
        function D(t) {
          if (It.test(t)) {
            for (var n = (St.lastIndex = 0); St.test(t); ) ++n;
            t = n;
          } else t = Yt(t);
          return t;
        }
        function M(t) {
          return It.test(t) ? t.match(St) || [] : t.split('');
        }
        var T,
          $ = 1 / 0,
          F = NaN,
          N = [
            ['ary', 128],
            ['bind', 1],
            ['bindKey', 2],
            ['curry', 8],
            ['curryRight', 16],
            ['flip', 512],
            ['partial', 32],
            ['partialRight', 64],
            ['rearg', 256],
          ],
          P = /\b__p\+='';/g,
          Z = /\b(__p\+=)''\+/g,
          q = /(__e\(.*?\)|\b__t\))\+'';/g,
          V = /&(?:amp|lt|gt|quot|#39);/g,
          K = /[&<>"']/g,
          G = RegExp(V.source),
          H = RegExp(K.source),
          J = /<%-([\s\S]+?)%>/g,
          Y = /<%([\s\S]+?)%>/g,
          Q = /<%=([\s\S]+?)%>/g,
          X = /\.|\[(?:[^[\]]*|(["'])(?:(?!\1)[^\\]|\\.)*?\1)\]/,
          tt = /^\w*$/,
          nt = /[^.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|$))/g,
          rt = /[\\^$.*+?()[\]{}|]/g,
          et = RegExp(rt.source),
          ut = /^\s+|\s+$/g,
          it = /^\s+/,
          ot = /\s+$/,
          ft = /\{(?:\n\/\* \[wrapped with .+\] \*\/)?\n?/,
          ct = /\{\n\/\* \[wrapped with (.+)\] \*/,
          at = /,? & /,
          lt = /[^\x00-\x2f\x3a-\x40\x5b-\x60\x7b-\x7f]+/g,
          st = /\\(\\)?/g,
          ht = /\$\{([^\\}]*(?:\\.[^\\}]*)*)\}/g,
          pt = /\w*$/,
          _t = /^[-+]0x[0-9a-f]+$/i,
          vt = /^0b[01]+$/i,
          gt = /^\[object .+?Constructor\]$/,
          dt = /^0o[0-7]+$/i,
          yt = /^(?:0|[1-9]\d*)$/,
          bt = /[\xc0-\xd6\xd8-\xf6\xf8-\xff\u0100-\u017f]/g,
          xt = /($^)/,
          jt = /['\n\r\u2028\u2029\\]/g,
          wt =
            '[\\ufe0e\\ufe0f]?(?:[\\u0300-\\u036f\\ufe20-\\ufe2f\\u20d0-\\u20ff]|\\ud83c[\\udffb-\\udfff])?(?:\\u200d(?:[^\\ud800-\\udfff]|(?:\\ud83c[\\udde6-\\uddff]){2}|[\\ud800-\\udbff][\\udc00-\\udfff])[\\ufe0e\\ufe0f]?(?:[\\u0300-\\u036f\\ufe20-\\ufe2f\\u20d0-\\u20ff]|\\ud83c[\\udffb-\\udfff])?)*',
          mt = '(?:[\\u2700-\\u27bf]|(?:\\ud83c[\\udde6-\\uddff]){2}|[\\ud800-\\udbff][\\udc00-\\udfff])' + wt,
          At = '(?:[^\\ud800-\\udfff][\\u0300-\\u036f\\ufe20-\\ufe2f\\u20d0-\\u20ff]?|[\\u0300-\\u036f\\ufe20-\\ufe2f\\u20d0-\\u20ff]|(?:\\ud83c[\\udde6-\\uddff]){2}|[\\ud800-\\udbff][\\udc00-\\udfff]|[\\ud800-\\udfff])',
          Et = RegExp("['’]", 'g'),
          kt = RegExp('[\\u0300-\\u036f\\ufe20-\\ufe2f\\u20d0-\\u20ff]', 'g'),
          St = RegExp('\\ud83c[\\udffb-\\udfff](?=\\ud83c[\\udffb-\\udfff])|' + At + wt, 'g'),
          Ot = RegExp(
            [
              "[A-Z\\xc0-\\xd6\\xd8-\\xde]?[a-z\\xdf-\\xf6\\xf8-\\xff]+(?:['’](?:d|ll|m|re|s|t|ve))?(?=[\\xac\\xb1\\xd7\\xf7\\x00-\\x2f\\x3a-\\x40\\x5b-\\x60\\x7b-\\xbf\\u2000-\\u206f \\t\\x0b\\f\\xa0\\ufeff\\n\\r\\u2028\\u2029\\u1680\\u180e\\u2000\\u2001\\u2002\\u2003\\u2004\\u2005\\u2006\\u2007\\u2008\\u2009\\u200a\\u202f\\u205f\\u3000]|[A-Z\\xc0-\\xd6\\xd8-\\xde]|$)|(?:[A-Z\\xc0-\\xd6\\xd8-\\xde]|[^\\ud800-\\udfff\\xac\\xb1\\xd7\\xf7\\x00-\\x2f\\x3a-\\x40\\x5b-\\x60\\x7b-\\xbf\\u2000-\\u206f \\t\\x0b\\f\\xa0\\ufeff\\n\\r\\u2028\\u2029\\u1680\\u180e\\u2000\\u2001\\u2002\\u2003\\u2004\\u2005\\u2006\\u2007\\u2008\\u2009\\u200a\\u202f\\u205f\\u3000\\d+\\u2700-\\u27bfa-z\\xdf-\\xf6\\xf8-\\xffA-Z\\xc0-\\xd6\\xd8-\\xde])+(?:['’](?:D|LL|M|RE|S|T|VE))?(?=[\\xac\\xb1\\xd7\\xf7\\x00-\\x2f\\x3a-\\x40\\x5b-\\x60\\x7b-\\xbf\\u2000-\\u206f \\t\\x0b\\f\\xa0\\ufeff\\n\\r\\u2028\\u2029\\u1680\\u180e\\u2000\\u2001\\u2002\\u2003\\u2004\\u2005\\u2006\\u2007\\u2008\\u2009\\u200a\\u202f\\u205f\\u3000]|[A-Z\\xc0-\\xd6\\xd8-\\xde](?:[a-z\\xdf-\\xf6\\xf8-\\xff]|[^\\ud800-\\udfff\\xac\\xb1\\xd7\\xf7\\x00-\\x2f\\x3a-\\x40\\x5b-\\x60\\x7b-\\xbf\\u2000-\\u206f \\t\\x0b\\f\\xa0\\ufeff\\n\\r\\u2028\\u2029\\u1680\\u180e\\u2000\\u2001\\u2002\\u2003\\u2004\\u2005\\u2006\\u2007\\u2008\\u2009\\u200a\\u202f\\u205f\\u3000\\d+\\u2700-\\u27bfa-z\\xdf-\\xf6\\xf8-\\xffA-Z\\xc0-\\xd6\\xd8-\\xde])|$)|[A-Z\\xc0-\\xd6\\xd8-\\xde]?(?:[a-z\\xdf-\\xf6\\xf8-\\xff]|[^\\ud800-\\udfff\\xac\\xb1\\xd7\\xf7\\x00-\\x2f\\x3a-\\x40\\x5b-\\x60\\x7b-\\xbf\\u2000-\\u206f \\t\\x0b\\f\\xa0\\ufeff\\n\\r\\u2028\\u2029\\u1680\\u180e\\u2000\\u2001\\u2002\\u2003\\u2004\\u2005\\u2006\\u2007\\u2008\\u2009\\u200a\\u202f\\u205f\\u3000\\d+\\u2700-\\u27bfa-z\\xdf-\\xf6\\xf8-\\xffA-Z\\xc0-\\xd6\\xd8-\\xde])+(?:['’](?:d|ll|m|re|s|t|ve))?|[A-Z\\xc0-\\xd6\\xd8-\\xde]+(?:['’](?:D|LL|M|RE|S|T|VE))?|\\d*(?:1ST|2ND|3RD|(?![123])\\dTH)(?=\\b|[a-z_])|\\d*(?:1st|2nd|3rd|(?![123])\\dth)(?=\\b|[A-Z_])|\\d+",
              mt,
            ].join('|'),
            'g'
          ),
          It = RegExp('[\\u200d\\ud800-\\udfff\\u0300-\\u036f\\ufe20-\\ufe2f\\u20d0-\\u20ff\\ufe0e\\ufe0f]'),
          Rt = /[a-z][A-Z]|[A-Z]{2}[a-z]|[0-9][a-zA-Z]|[a-zA-Z][0-9]|[^a-zA-Z0-9 ]/,
          zt = 'Array Buffer DataView Date Error Float32Array Float64Array Function Int8Array Int16Array Int32Array Map Math Object Promise RegExp Set String Symbol TypeError Uint8Array Uint8ClampedArray Uint16Array Uint32Array WeakMap _ clearTimeout isFinite parseInt setTimeout'.split(' '),
          Wt = {};
        (Wt['[object Float32Array]'] = Wt['[object Float64Array]'] = Wt['[object Int8Array]'] = Wt['[object Int16Array]'] = Wt['[object Int32Array]'] = Wt['[object Uint8Array]'] = Wt['[object Uint8ClampedArray]'] = Wt['[object Uint16Array]'] = Wt['[object Uint32Array]'] = true),
          (Wt['[object Arguments]'] =
            Wt['[object Array]'] =
            Wt['[object ArrayBuffer]'] =
            Wt['[object Boolean]'] =
            Wt['[object DataView]'] =
            Wt['[object Date]'] =
            Wt['[object Error]'] =
            Wt['[object Function]'] =
            Wt['[object Map]'] =
            Wt['[object Number]'] =
            Wt['[object Object]'] =
            Wt['[object RegExp]'] =
            Wt['[object Set]'] =
            Wt['[object String]'] =
            Wt['[object WeakMap]'] =
              false);
        var Bt = {};
        (Bt['[object Arguments]'] =
          Bt['[object Array]'] =
          Bt['[object ArrayBuffer]'] =
          Bt['[object DataView]'] =
          Bt['[object Boolean]'] =
          Bt['[object Date]'] =
          Bt['[object Float32Array]'] =
          Bt['[object Float64Array]'] =
          Bt['[object Int8Array]'] =
          Bt['[object Int16Array]'] =
          Bt['[object Int32Array]'] =
          Bt['[object Map]'] =
          Bt['[object Number]'] =
          Bt['[object Object]'] =
          Bt['[object RegExp]'] =
          Bt['[object Set]'] =
          Bt['[object String]'] =
          Bt['[object Symbol]'] =
          Bt['[object Uint8Array]'] =
          Bt['[object Uint8ClampedArray]'] =
          Bt['[object Uint16Array]'] =
          Bt['[object Uint32Array]'] =
            true),
          (Bt['[object Error]'] = Bt['[object Function]'] = Bt['[object WeakMap]'] = false);
        var Lt = { '\\': '\\', "'": "'", '\n': 'n', '\r': 'r', '\u2028': 'u2028', '\u2029': 'u2029' },
          Ut = parseFloat,
          Ct = parseInt,
          Dt = typeof global == 'object' && global && global.Object === Object && global,
          Mt = typeof self == 'object' && self && self.Object === Object && self,
          Tt = Dt || Mt || Function('return this')(),
          $t = typeof exports == 'object' && exports && !exports.nodeType && exports,
          Ft = $t && typeof module == 'object' && module && !module.nodeType && module,
          Nt = Ft && Ft.exports === $t,
          Pt = Nt && Dt.process,
          Zt = (function () {
            try {
              var t = Ft && Ft.f && Ft.f('util').types;
              return t ? t : Pt && Pt.binding && Pt.binding('util');
            } catch (t) {}
          })(),
          qt = Zt && Zt.isArrayBuffer,
          Vt = Zt && Zt.isDate,
          Kt = Zt && Zt.isMap,
          Gt = Zt && Zt.isRegExp,
          Ht = Zt && Zt.isSet,
          Jt = Zt && Zt.isTypedArray,
          Yt = b('length'),
          Qt = x({
            À: 'A',
            Á: 'A',
            Â: 'A',
            Ã: 'A',
            Ä: 'A',
            Å: 'A',
            à: 'a',
            á: 'a',
            â: 'a',
            ã: 'a',
            ä: 'a',
            å: 'a',
            Ç: 'C',
            ç: 'c',
            Ð: 'D',
            ð: 'd',
            È: 'E',
            É: 'E',
            Ê: 'E',
            Ë: 'E',
            è: 'e',
            é: 'e',
            ê: 'e',
            ë: 'e',
            Ì: 'I',
            Í: 'I',
            Î: 'I',
            Ï: 'I',
            ì: 'i',
            í: 'i',
            î: 'i',
            ï: 'i',
            Ñ: 'N',
            ñ: 'n',
            Ò: 'O',
            Ó: 'O',
            Ô: 'O',
            Õ: 'O',
            Ö: 'O',
            Ø: 'O',
            ò: 'o',
            ó: 'o',
            ô: 'o',
            õ: 'o',
            ö: 'o',
            ø: 'o',
            Ù: 'U',
            Ú: 'U',
            Û: 'U',
            Ü: 'U',
            ù: 'u',
            ú: 'u',
            û: 'u',
            ü: 'u',
            Ý: 'Y',
            ý: 'y',
            ÿ: 'y',
            Æ: 'Ae',
            æ: 'ae',
            Þ: 'Th',
            þ: 'th',
            ß: 'ss',
            Ā: 'A',
            Ă: 'A',
            Ą: 'A',
            ā: 'a',
            ă: 'a',
            ą: 'a',
            Ć: 'C',
            Ĉ: 'C',
            Ċ: 'C',
            Č: 'C',
            ć: 'c',
            ĉ: 'c',
            ċ: 'c',
            č: 'c',
            Ď: 'D',
            Đ: 'D',
            ď: 'd',
            đ: 'd',
            Ē: 'E',
            Ĕ: 'E',
            Ė: 'E',
            Ę: 'E',
            Ě: 'E',
            ē: 'e',
            ĕ: 'e',
            ė: 'e',
            ę: 'e',
            ě: 'e',
            Ĝ: 'G',
            Ğ: 'G',
            Ġ: 'G',
            Ģ: 'G',
            ĝ: 'g',
            ğ: 'g',
            ġ: 'g',
            ģ: 'g',
            Ĥ: 'H',
            Ħ: 'H',
            ĥ: 'h',
            ħ: 'h',
            Ĩ: 'I',
            Ī: 'I',
            Ĭ: 'I',
            Į: 'I',
            İ: 'I',
            ĩ: 'i',
            ī: 'i',
            ĭ: 'i',
            į: 'i',
            ı: 'i',
            Ĵ: 'J',
            ĵ: 'j',
            Ķ: 'K',
            ķ: 'k',
            ĸ: 'k',
            Ĺ: 'L',
            Ļ: 'L',
            Ľ: 'L',
            Ŀ: 'L',
            Ł: 'L',
            ĺ: 'l',
            ļ: 'l',
            ľ: 'l',
            ŀ: 'l',
            ł: 'l',
            Ń: 'N',
            Ņ: 'N',
            Ň: 'N',
            Ŋ: 'N',
            ń: 'n',
            ņ: 'n',
            ň: 'n',
            ŋ: 'n',
            Ō: 'O',
            Ŏ: 'O',
            Ő: 'O',
            ō: 'o',
            ŏ: 'o',
            ő: 'o',
            Ŕ: 'R',
            Ŗ: 'R',
            Ř: 'R',
            ŕ: 'r',
            ŗ: 'r',
            ř: 'r',
            Ś: 'S',
            Ŝ: 'S',
            Ş: 'S',
            Š: 'S',
            ś: 's',
            ŝ: 's',
            ş: 's',
            š: 's',
            Ţ: 'T',
            Ť: 'T',
            Ŧ: 'T',
            ţ: 't',
            ť: 't',
            ŧ: 't',
            Ũ: 'U',
            Ū: 'U',
            Ŭ: 'U',
            Ů: 'U',
            Ű: 'U',
            Ų: 'U',
            ũ: 'u',
            ū: 'u',
            ŭ: 'u',
            ů: 'u',
            ű: 'u',
            ų: 'u',
            Ŵ: 'W',
            ŵ: 'w',
            Ŷ: 'Y',
            ŷ: 'y',
            Ÿ: 'Y',
            Ź: 'Z',
            Ż: 'Z',
            Ž: 'Z',
            ź: 'z',
            ż: 'z',
            ž: 'z',
            Ĳ: 'IJ',
            ĳ: 'ij',
            Œ: 'Oe',
            œ: 'oe',
            ŉ: "'n",
            ſ: 's',
          }),
          Xt = x({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }),
          tn = x({ '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'" }),
          nn = (function x(wt) {
            function mt(t) {
              if (yu(t) && !ff(t) && !(t instanceof Lt)) {
                if (t instanceof St) return t;
                if (oi.call(t, '__wrapped__')) return Fe(t);
              }
              return new St(t);
            }
            function At() {}
            function St(t, n) {
              (this.__wrapped__ = t), (this.__actions__ = []), (this.__chain__ = !!n), (this.__index__ = 0), (this.__values__ = T);
            }
            function Lt(t) {
              (this.__wrapped__ = t), (this.__actions__ = []), (this.__dir__ = 1), (this.__filtered__ = false), (this.__iteratees__ = []), (this.__takeCount__ = 4294967295), (this.__views__ = []);
            }
            function Dt(t) {
              var n = -1,
                r = null == t ? 0 : t.length;
              for (this.clear(); ++n < r; ) {
                var e = t[n];
                this.set(e[0], e[1]);
              }
            }
            function Mt(t) {
              var n = -1,
                r = null == t ? 0 : t.length;
              for (this.clear(); ++n < r; ) {
                var e = t[n];
                this.set(e[0], e[1]);
              }
            }
            function $t(t) {
              var n = -1,
                r = null == t ? 0 : t.length;
              for (this.clear(); ++n < r; ) {
                var e = t[n];
                this.set(e[0], e[1]);
              }
            }
            function Ft(t) {
              var n = -1,
                r = null == t ? 0 : t.length;
              for (this.__data__ = new $t(); ++n < r; ) this.add(t[n]);
            }
            function Pt(t) {
              this.size = (this.__data__ = new Mt(t)).size;
            }
            function Zt(t, n) {
              var r,
                e = ff(t),
                u = !e && of(t),
                i = !e && !u && af(t),
                o = !e && !u && !i && _f(t),
                u = (e = e || u || i || o) ? A(t.length, ti) : [],
                f = u.length;
              for (r in t) (!n && !oi.call(t, r)) || (e && ('length' == r || (i && ('offset' == r || 'parent' == r)) || (o && ('buffer' == r || 'byteLength' == r || 'byteOffset' == r)) || Se(r, f))) || u.push(r);
              return u;
            }
            function Yt(t) {
              var n = t.length;
              return n ? t[ir(0, n - 1)] : T;
            }
            function rn(t, n) {
              return De(Ur(t), pn(n, 0, t.length));
            }
            function en(t) {
              return De(Ur(t));
            }
            function un(t, n, r) {
              ((r === T || lu(t[n], r)) && (r !== T || n in t)) || sn(t, n, r);
            }
            function on(t, n, r) {
              var e = t[n];
              (oi.call(t, n) && lu(e, r) && (r !== T || n in t)) || sn(t, n, r);
            }
            function fn(t, n) {
              for (var r = t.length; r--; ) if (lu(t[r][0], n)) return r;
              return -1;
            }
            function cn(t, n, r, e) {
              return (
                uo(t, function (t, u, i) {
                  n(e, t, r(t), i);
                }),
                e
              );
            }
            function an(t, n) {
              return t && Cr(n, Wu(n), t);
            }
            function ln(t, n) {
              return t && Cr(n, Bu(n), t);
            }
            function sn(t, n, r) {
              '__proto__' == n && Ai ? Ai(t, n, { configurable: true, enumerable: true, value: r, writable: true }) : (t[n] = r);
            }
            function hn(t, n) {
              for (var r = -1, e = n.length, u = Ku(e), i = null == t; ++r < e; ) u[r] = i ? T : Ru(t, n[r]);
              return u;
            }
            function pn(t, n, r) {
              return t === t && (r !== T && (t = t <= r ? t : r), n !== T && (t = t >= n ? t : n)), t;
            }
            function _n(t, n, e, u, i, o) {
              var f,
                c = 1 & n,
                a = 2 & n,
                l = 4 & n;
              if ((e && (f = i ? e(t, u, i, o) : e(t)), f !== T)) return f;
              if (!du(t)) return t;
              if ((u = ff(t))) {
                if (((f = me(t)), !c)) return Ur(t, f);
              } else {
                var s = vo(t),
                  h = '[object Function]' == s || '[object GeneratorFunction]' == s;
                if (af(t)) return Ir(t, c);
                if ('[object Object]' == s || '[object Arguments]' == s || (h && !i)) {
                  if (((f = a || h ? {} : Ae(t)), !c)) return a ? Mr(t, ln(f, t)) : Dr(t, an(f, t));
                } else {
                  if (!Bt[s]) return i ? t : {};
                  f = Ee(t, s, c);
                }
              }
              if ((o || (o = new Pt()), (i = o.get(t)))) return i;
              o.set(t, f),
                pf(t)
                  ? t.forEach(function (r) {
                      f.add(_n(r, n, e, r, t, o));
                    })
                  : sf(t) &&
                    t.forEach(function (r, u) {
                      f.set(u, _n(r, n, e, u, t, o));
                    });
              var a = l ? (a ? ve : _e) : a ? Bu : Wu,
                p = u ? T : a(t);
              return (
                r(p || t, function (r, u) {
                  p && ((u = r), (r = t[u])), on(f, u, _n(r, n, e, u, t, o));
                }),
                f
              );
            }
            function vn(t) {
              var n = Wu(t);
              return function (r) {
                return gn(r, t, n);
              };
            }
            function gn(t, n, r) {
              var e = r.length;
              if (null == t) return !e;
              for (t = Qu(t); e--; ) {
                var u = r[e],
                  i = n[u],
                  o = t[u];
                if ((o === T && !(u in t)) || !i(o)) return false;
              }
              return true;
            }
            function dn(t, n, r) {
              if (typeof t != 'function') throw new ni('Expected a function');
              return bo(function () {
                t.apply(T, r);
              }, n);
            }
            function yn(t, n, r, e) {
              var u = -1,
                i = o,
                a = true,
                l = t.length,
                s = [],
                h = n.length;
              if (!l) return s;
              r && (n = c(n, k(r))), e ? ((i = f), (a = false)) : 200 <= n.length && ((i = O), (a = false), (n = new Ft(n)));
              t: for (; ++u < l; ) {
                var p = t[u],
                  _ = null == r ? p : r(p),
                  p = e || 0 !== p ? p : 0;
                if (a && _ === _) {
                  for (var v = h; v--; ) if (n[v] === _) continue t;
                  s.push(p);
                } else i(n, _, e) || s.push(p);
              }
              return s;
            }
            function bn(t, n) {
              var r = true;
              return (
                uo(t, function (t, e, u) {
                  return (r = !!n(t, e, u));
                }),
                r
              );
            }
            function xn(t, n, r) {
              for (var e = -1, u = t.length; ++e < u; ) {
                var i = t[e],
                  o = n(i);
                if (null != o && (f === T ? o === o && !wu(o) : r(o, f)))
                  var f = o,
                    c = i;
              }
              return c;
            }
            function jn(t, n) {
              var r = [];
              return (
                uo(t, function (t, e, u) {
                  n(t, e, u) && r.push(t);
                }),
                r
              );
            }
            function wn(t, n, r, e, u) {
              var i = -1,
                o = t.length;
              for (r || (r = ke), u || (u = []); ++i < o; ) {
                var f = t[i];
                0 < n && r(f) ? (1 < n ? wn(f, n - 1, r, e, u) : a(u, f)) : e || (u[u.length] = f);
              }
              return u;
            }
            function mn(t, n) {
              return t && oo(t, n, Wu);
            }
            function An(t, n) {
              return t && fo(t, n, Wu);
            }
            function En(t, n) {
              return i(n, function (n) {
                return _u(t[n]);
              });
            }
            function kn(t, n) {
              n = Sr(n, t);
              for (var r = 0, e = n.length; null != t && r < e; ) t = t[Me(n[r++])];
              return r && r == e ? t : T;
            }
            function Sn(t, n, r) {
              return (n = n(t)), ff(t) ? n : a(n, r(t));
            }
            function On(t) {
              if (null == t) t = t === T ? '[object Undefined]' : '[object Null]';
              else if (mi && mi in Qu(t)) {
                var n = oi.call(t, mi),
                  r = t[mi];
                try {
                  t[mi] = T;
                  var e = true;
                } catch (t) {}
                var u = ai.call(t);
                e && (n ? (t[mi] = r) : delete t[mi]), (t = u);
              } else t = ai.call(t);
              return t;
            }
            function In(t, n) {
              return t > n;
            }
            function Rn(t, n) {
              return null != t && oi.call(t, n);
            }
            function zn(t, n) {
              return null != t && n in Qu(t);
            }
            function Wn(t, n, r) {
              for (var e = r ? f : o, u = t[0].length, i = t.length, a = i, l = Ku(i), s = 1 / 0, h = []; a--; ) {
                var p = t[a];
                a && n && (p = c(p, k(n))), (s = Ci(p.length, s)), (l[a] = !r && (n || (120 <= u && 120 <= p.length)) ? new Ft(a && p) : T);
              }
              var p = t[0],
                _ = -1,
                v = l[0];
              t: for (; ++_ < u && h.length < s; ) {
                var g = p[_],
                  d = n ? n(g) : g,
                  g = r || 0 !== g ? g : 0;
                if (v ? !O(v, d) : !e(h, d, r)) {
                  for (a = i; --a; ) {
                    var y = l[a];
                    if (y ? !O(y, d) : !e(t[a], d, r)) continue t;
                  }
                  v && v.push(d), h.push(g);
                }
              }
              return h;
            }
            function Bn(t, n, r) {
              var e = {};
              return (
                mn(t, function (t, u, i) {
                  n(e, r(t), u, i);
                }),
                e
              );
            }
            function Ln(n, r, e) {
              return (r = Sr(r, n)), (n = 2 > r.length ? n : kn(n, hr(r, 0, -1))), (r = null == n ? n : n[Me(Ve(r))]), null == r ? T : t(r, n, e);
            }
            function Un(t) {
              return yu(t) && '[object Arguments]' == On(t);
            }
            function Cn(t) {
              return yu(t) && '[object ArrayBuffer]' == On(t);
            }
            function Dn(t) {
              return yu(t) && '[object Date]' == On(t);
            }
            function Mn(t, n, r, e, u) {
              if (t === n) n = true;
              else if (null == t || null == n || (!yu(t) && !yu(n))) n = t !== t && n !== n;
              else
                t: {
                  var i = ff(t),
                    o = ff(n),
                    f = i ? '[object Array]' : vo(t),
                    c = o ? '[object Array]' : vo(n),
                    f = '[object Arguments]' == f ? '[object Object]' : f,
                    c = '[object Arguments]' == c ? '[object Object]' : c,
                    a = '[object Object]' == f,
                    o = '[object Object]' == c;
                  if ((c = f == c) && af(t)) {
                    if (!af(n)) {
                      n = false;
                      break t;
                    }
                    (i = true), (a = false);
                  }
                  if (c && !a) u || (u = new Pt()), (n = i || _f(t) ? se(t, n, r, e, Mn, u) : he(t, n, f, r, e, Mn, u));
                  else {
                    if (!(1 & r) && ((i = a && oi.call(t, '__wrapped__')), (f = o && oi.call(n, '__wrapped__')), i || f)) {
                      (t = i ? t.value() : t), (n = f ? n.value() : n), u || (u = new Pt()), (n = Mn(t, n, r, e, u));
                      break t;
                    }
                    if (c)
                      n: if ((u || (u = new Pt()), (i = 1 & r), (f = _e(t)), (o = f.length), (c = _e(n).length), o == c || i)) {
                        for (a = o; a--; ) {
                          var l = f[a];
                          if (!(i ? l in n : oi.call(n, l))) {
                            n = false;
                            break n;
                          }
                        }
                        if ((c = u.get(t)) && u.get(n)) n = c == n;
                        else {
                          (c = true), u.set(t, n), u.set(n, t);
                          for (var s = i; ++a < o; ) {
                            var l = f[a],
                              h = t[l],
                              p = n[l];
                            if (e) var _ = i ? e(p, h, l, n, t, u) : e(h, p, l, t, n, u);
                            if (_ === T ? h !== p && !Mn(h, p, r, e, u) : !_) {
                              c = false;
                              break;
                            }
                            s || (s = 'constructor' == l);
                          }
                          c && !s && ((r = t.constructor), (e = n.constructor), r != e && 'constructor' in t && 'constructor' in n && !(typeof r == 'function' && r instanceof r && typeof e == 'function' && e instanceof e) && (c = false)), u.delete(t), u.delete(n), (n = c);
                        }
                      } else n = false;
                    else n = false;
                  }
                }
              return n;
            }
            function Tn(t) {
              return yu(t) && '[object Map]' == vo(t);
            }
            function $n(t, n, r, e) {
              var u = r.length,
                i = u,
                o = !e;
              if (null == t) return !i;
              for (t = Qu(t); u--; ) {
                var f = r[u];
                if (o && f[2] ? f[1] !== t[f[0]] : !(f[0] in t)) return false;
              }
              for (; ++u < i; ) {
                var f = r[u],
                  c = f[0],
                  a = t[c],
                  l = f[1];
                if (o && f[2]) {
                  if (a === T && !(c in t)) return false;
                } else {
                  if (((f = new Pt()), e)) var s = e(a, l, c, t, n, f);
                  if (s === T ? !Mn(l, a, 3, e, f) : !s) return false;
                }
              }
              return true;
            }
            function Fn(t) {
              return !(!du(t) || (ci && ci in t)) && (_u(t) ? hi : gt).test(Te(t));
            }
            function Nn(t) {
              return yu(t) && '[object RegExp]' == On(t);
            }
            function Pn(t) {
              return yu(t) && '[object Set]' == vo(t);
            }
            function Zn(t) {
              return yu(t) && gu(t.length) && !!Wt[On(t)];
            }
            function qn(t) {
              return typeof t == 'function' ? t : null == t ? $u : typeof t == 'object' ? (ff(t) ? Jn(t[0], t[1]) : Hn(t)) : Zu(t);
            }
            function Vn(t) {
              if (!ze(t)) return Li(t);
              var n,
                r = [];
              for (n in Qu(t)) oi.call(t, n) && 'constructor' != n && r.push(n);
              return r;
            }
            function Kn(t, n) {
              return t < n;
            }
            function Gn(t, n) {
              var r = -1,
                e = su(t) ? Ku(t.length) : [];
              return (
                uo(t, function (t, u, i) {
                  e[++r] = n(t, u, i);
                }),
                e
              );
            }
            function Hn(t) {
              var n = xe(t);
              return 1 == n.length && n[0][2]
                ? We(n[0][0], n[0][1])
                : function (r) {
                    return r === t || $n(r, t, n);
                  };
            }
            function Jn(t, n) {
              return Ie(t) && n === n && !du(n)
                ? We(Me(t), n)
                : function (r) {
                    var e = Ru(r, t);
                    return e === T && e === n ? zu(r, t) : Mn(n, e, 3);
                  };
            }
            function Yn(t, n, r, e, u) {
              t !== n &&
                oo(
                  n,
                  function (i, o) {
                    if ((u || (u = new Pt()), du(i))) {
                      var f = u,
                        c = Le(t, o),
                        a = Le(n, o),
                        l = f.get(a);
                      if (l) un(t, o, l);
                      else {
                        var l = e ? e(c, a, o + '', t, n, f) : T,
                          s = l === T;
                        if (s) {
                          var h = ff(a),
                            p = !h && af(a),
                            _ = !h && !p && _f(a),
                            l = a;
                          h || p || _ ? (ff(c) ? (l = c) : hu(c) ? (l = Ur(c)) : p ? ((s = false), (l = Ir(a, true))) : _ ? ((s = false), (l = zr(a, true))) : (l = [])) : xu(a) || of(a) ? ((l = c), of(c) ? (l = Ou(c)) : (du(c) && !_u(c)) || (l = Ae(a))) : (s = false);
                        }
                        s && (f.set(a, l), Yn(l, a, r, e, f), f.delete(a)), un(t, o, l);
                      }
                    } else (f = e ? e(Le(t, o), i, o + '', t, n, u) : T), f === T && (f = i), un(t, o, f);
                  },
                  Bu
                );
            }
            function Qn(t, n) {
              var r = t.length;
              if (r) return (n += 0 > n ? r : 0), Se(n, r) ? t[n] : T;
            }
            function Xn(t, n, r) {
              var e = -1;
              return (
                (n = c(n.length ? n : [$u], k(ye()))),
                (t = Gn(t, function (t) {
                  return {
                    a: c(n, function (n) {
                      return n(t);
                    }),
                    b: ++e,
                    c: t,
                  };
                })),
                w(t, function (t, n) {
                  var e;
                  t: {
                    e = -1;
                    for (var u = t.a, i = n.a, o = u.length, f = r.length; ++e < o; ) {
                      var c = Wr(u[e], i[e]);
                      if (c) {
                        e = e >= f ? c : c * ('desc' == r[e] ? -1 : 1);
                        break t;
                      }
                    }
                    e = t.b - n.b;
                  }
                  return e;
                })
              );
            }
            function tr(t, n) {
              return nr(t, n, function (n, r) {
                return zu(t, r);
              });
            }
            function nr(t, n, r) {
              for (var e = -1, u = n.length, i = {}; ++e < u; ) {
                var o = n[e],
                  f = kn(t, o);
                r(f, o) && lr(i, Sr(o, t), f);
              }
              return i;
            }
            function rr(t) {
              return function (n) {
                return kn(n, t);
              };
            }
            function er(t, n, r, e) {
              var u = e ? g : v,
                i = -1,
                o = n.length,
                f = t;
              for (t === n && (n = Ur(n)), r && (f = c(t, k(r))); ++i < o; ) for (var a = 0, l = n[i], l = r ? r(l) : l; -1 < (a = u(f, l, a, e)); ) f !== t && xi.call(f, a, 1), xi.call(t, a, 1);
              return t;
            }
            function ur(t, n) {
              for (var r = t ? n.length : 0, e = r - 1; r--; ) {
                var u = n[r];
                if (r == e || u !== i) {
                  var i = u;
                  Se(u) ? xi.call(t, u, 1) : xr(t, u);
                }
              }
            }
            function ir(t, n) {
              return t + Ii(Ti() * (n - t + 1));
            }
            function or(t, n) {
              var r = '';
              if (!t || 1 > n || 9007199254740991 < n) return r;
              do {
                n % 2 && (r += t), (n = Ii(n / 2)) && (t += t);
              } while (n);
              return r;
            }
            function fr(t, n) {
              return xo(Be(t, n, $u), t + '');
            }
            function cr(t) {
              return Yt(Uu(t));
            }
            function ar(t, n) {
              var r = Uu(t);
              return De(r, pn(n, 0, r.length));
            }
            function lr(t, n, r, e) {
              if (!du(t)) return t;
              n = Sr(n, t);
              for (var u = -1, i = n.length, o = i - 1, f = t; null != f && ++u < i; ) {
                var c = Me(n[u]),
                  a = r;
                if (u != o) {
                  var l = f[c],
                    a = e ? e(l, c, f) : T;
                  a === T && (a = du(l) ? l : Se(n[u + 1]) ? [] : {});
                }
                on(f, c, a), (f = f[c]);
              }
              return t;
            }
            function sr(t) {
              return De(Uu(t));
            }
            function hr(t, n, r) {
              var e = -1,
                u = t.length;
              for (0 > n && (n = -n > u ? 0 : u + n), r = r > u ? u : r, 0 > r && (r += u), u = n > r ? 0 : (r - n) >>> 0, n >>>= 0, r = Ku(u); ++e < u; ) r[e] = t[e + n];
              return r;
            }
            function pr(t, n) {
              var r;
              return (
                uo(t, function (t, e, u) {
                  return (r = n(t, e, u)), !r;
                }),
                !!r
              );
            }
            function _r(t, n, r) {
              var e = 0,
                u = null == t ? e : t.length;
              if (typeof n == 'number' && n === n && 2147483647 >= u) {
                for (; e < u; ) {
                  var i = (e + u) >>> 1,
                    o = t[i];
                  null !== o && !wu(o) && (r ? o <= n : o < n) ? (e = i + 1) : (u = i);
                }
                return u;
              }
              return vr(t, n, $u, r);
            }
            function vr(t, n, r, e) {
              n = r(n);
              for (var u = 0, i = null == t ? 0 : t.length, o = n !== n, f = null === n, c = wu(n), a = n === T; u < i; ) {
                var l = Ii((u + i) / 2),
                  s = r(t[l]),
                  h = s !== T,
                  p = null === s,
                  _ = s === s,
                  v = wu(s);
                (o ? e || _ : a ? _ && (e || h) : f ? _ && h && (e || !p) : c ? _ && h && !p && (e || !v) : p || v ? 0 : e ? s <= n : s < n) ? (u = l + 1) : (i = l);
              }
              return Ci(i, 4294967294);
            }
            function gr(t, n) {
              for (var r = -1, e = t.length, u = 0, i = []; ++r < e; ) {
                var o = t[r],
                  f = n ? n(o) : o;
                if (!r || !lu(f, c)) {
                  var c = f;
                  i[u++] = 0 === o ? 0 : o;
                }
              }
              return i;
            }
            function dr(t) {
              return typeof t == 'number' ? t : wu(t) ? F : +t;
            }
            function yr(t) {
              if (typeof t == 'string') return t;
              if (ff(t)) return c(t, yr) + '';
              if (wu(t)) return ro ? ro.call(t) : '';
              var n = t + '';
              return '0' == n && 1 / t == -$ ? '-0' : n;
            }
            function br(t, n, r) {
              var e = -1,
                u = o,
                i = t.length,
                c = true,
                a = [],
                l = a;
              if (r) (c = false), (u = f);
              else if (200 <= i) {
                if ((u = n ? null : so(t))) return U(u);
                (c = false), (u = O), (l = new Ft());
              } else l = n ? [] : a;
              t: for (; ++e < i; ) {
                var s = t[e],
                  h = n ? n(s) : s,
                  s = r || 0 !== s ? s : 0;
                if (c && h === h) {
                  for (var p = l.length; p--; ) if (l[p] === h) continue t;
                  n && l.push(h), a.push(s);
                } else u(l, h, r) || (l !== a && l.push(h), a.push(s));
              }
              return a;
            }
            function xr(t, n) {
              return (n = Sr(n, t)), (t = 2 > n.length ? t : kn(t, hr(n, 0, -1))), null == t || delete t[Me(Ve(n))];
            }
            function jr(t, n, r, e) {
              for (var u = t.length, i = e ? u : -1; (e ? i-- : ++i < u) && n(t[i], i, t); );
              return r ? hr(t, e ? 0 : i, e ? i + 1 : u) : hr(t, e ? i + 1 : 0, e ? u : i);
            }
            function wr(t, n) {
              var r = t;
              return (
                r instanceof Lt && (r = r.value()),
                l(
                  n,
                  function (t, n) {
                    return n.func.apply(n.thisArg, a([t], n.args));
                  },
                  r
                )
              );
            }
            function mr(t, n, r) {
              var e = t.length;
              if (2 > e) return e ? br(t[0]) : [];
              for (var u = -1, i = Ku(e); ++u < e; ) for (var o = t[u], f = -1; ++f < e; ) f != u && (i[u] = yn(i[u] || o, t[f], n, r));
              return br(wn(i, 1), n, r);
            }
            function Ar(t, n, r) {
              for (var e = -1, u = t.length, i = n.length, o = {}; ++e < u; ) r(o, t[e], e < i ? n[e] : T);
              return o;
            }
            function Er(t) {
              return hu(t) ? t : [];
            }
            function kr(t) {
              return typeof t == 'function' ? t : $u;
            }
            function Sr(t, n) {
              return ff(t) ? t : Ie(t, n) ? [t] : jo(Iu(t));
            }
            function Or(t, n, r) {
              var e = t.length;
              return (r = r === T ? e : r), !n && r >= e ? t : hr(t, n, r);
            }
            function Ir(t, n) {
              if (n) return t.slice();
              var r = t.length,
                r = gi ? gi(r) : new t.constructor(r);
              return t.copy(r), r;
            }
            function Rr(t) {
              var n = new t.constructor(t.byteLength);
              return new vi(n).set(new vi(t)), n;
            }
            function zr(t, n) {
              return new t.constructor(n ? Rr(t.buffer) : t.buffer, t.byteOffset, t.length);
            }
            function Wr(t, n) {
              if (t !== n) {
                var r = t !== T,
                  e = null === t,
                  u = t === t,
                  i = wu(t),
                  o = n !== T,
                  f = null === n,
                  c = n === n,
                  a = wu(n);
                if ((!f && !a && !i && t > n) || (i && o && c && !f && !a) || (e && o && c) || (!r && c) || !u) return 1;
                if ((!e && !i && !a && t < n) || (a && r && u && !e && !i) || (f && r && u) || (!o && u) || !c) return -1;
              }
              return 0;
            }
            function Br(t, n, r, e) {
              var u = -1,
                i = t.length,
                o = r.length,
                f = -1,
                c = n.length,
                a = Ui(i - o, 0),
                l = Ku(c + a);
              for (e = !e; ++f < c; ) l[f] = n[f];
              for (; ++u < o; ) (e || u < i) && (l[r[u]] = t[u]);
              for (; a--; ) l[f++] = t[u++];
              return l;
            }
            function Lr(t, n, r, e) {
              var u = -1,
                i = t.length,
                o = -1,
                f = r.length,
                c = -1,
                a = n.length,
                l = Ui(i - f, 0),
                s = Ku(l + a);
              for (e = !e; ++u < l; ) s[u] = t[u];
              for (l = u; ++c < a; ) s[l + c] = n[c];
              for (; ++o < f; ) (e || u < i) && (s[l + r[o]] = t[u++]);
              return s;
            }
            function Ur(t, n) {
              var r = -1,
                e = t.length;
              for (n || (n = Ku(e)); ++r < e; ) n[r] = t[r];
              return n;
            }
            function Cr(t, n, r, e) {
              var u = !r;
              r || (r = {});
              for (var i = -1, o = n.length; ++i < o; ) {
                var f = n[i],
                  c = e ? e(r[f], t[f], f, r, t) : T;
                c === T && (c = t[f]), u ? sn(r, f, c) : on(r, f, c);
              }
              return r;
            }
            function Dr(t, n) {
              return Cr(t, po(t), n);
            }
            function Mr(t, n) {
              return Cr(t, _o(t), n);
            }
            function Tr(t, r) {
              return function (e, u) {
                var i = ff(e) ? n : cn,
                  o = r ? r() : {};
                return i(e, t, ye(u, 2), o);
              };
            }
            function $r(t) {
              return fr(function (n, r) {
                var e = -1,
                  u = r.length,
                  i = 1 < u ? r[u - 1] : T,
                  o = 2 < u ? r[2] : T,
                  i = 3 < t.length && typeof i == 'function' ? (u--, i) : T;
                for (o && Oe(r[0], r[1], o) && ((i = 3 > u ? T : i), (u = 1)), n = Qu(n); ++e < u; ) (o = r[e]) && t(n, o, e, i);
                return n;
              });
            }
            function Fr(t, n) {
              return function (r, e) {
                if (null == r) return r;
                if (!su(r)) return t(r, e);
                for (var u = r.length, i = n ? u : -1, o = Qu(r); (n ? i-- : ++i < u) && false !== e(o[i], i, o); );
                return r;
              };
            }
            function Nr(t) {
              return function (n, r, e) {
                var u = -1,
                  i = Qu(n);
                e = e(n);
                for (var o = e.length; o--; ) {
                  var f = e[t ? o : ++u];
                  if (false === r(i[f], f, i)) break;
                }
                return n;
              };
            }
            function Pr(t, n, r) {
              function e() {
                return (this && this !== Tt && this instanceof e ? i : t).apply(u ? r : this, arguments);
              }
              var u = 1 & n,
                i = Vr(t);
              return e;
            }
            function Zr(t) {
              return function (n) {
                n = Iu(n);
                var r = It.test(n) ? M(n) : T,
                  e = r ? r[0] : n.charAt(0);
                return (n = r ? Or(r, 1).join('') : n.slice(1)), e[t]() + n;
              };
            }
            function qr(t) {
              return function (n) {
                return l(Mu(Du(n).replace(Et, '')), t, '');
              };
            }
            function Vr(t) {
              return function () {
                var n = arguments;
                switch (n.length) {
                  case 0:
                    return new t();
                  case 1:
                    return new t(n[0]);
                  case 2:
                    return new t(n[0], n[1]);
                  case 3:
                    return new t(n[0], n[1], n[2]);
                  case 4:
                    return new t(n[0], n[1], n[2], n[3]);
                  case 5:
                    return new t(n[0], n[1], n[2], n[3], n[4]);
                  case 6:
                    return new t(n[0], n[1], n[2], n[3], n[4], n[5]);
                  case 7:
                    return new t(n[0], n[1], n[2], n[3], n[4], n[5], n[6]);
                }
                var r = eo(t.prototype),
                  n = t.apply(r, n);
                return du(n) ? n : r;
              };
            }
            function Kr(n, r, e) {
              function u() {
                for (var o = arguments.length, f = Ku(o), c = o, a = de(u); c--; ) f[c] = arguments[c];
                return (c = 3 > o && f[0] !== a && f[o - 1] !== a ? [] : L(f, a)), (o -= c.length), o < e ? ue(n, r, Jr, u.placeholder, T, f, c, T, T, e - o) : t(this && this !== Tt && this instanceof u ? i : n, this, f);
              }
              var i = Vr(n);
              return u;
            }
            function Gr(t) {
              return function (n, r, e) {
                var u = Qu(n);
                if (!su(n)) {
                  var i = ye(r, 3);
                  (n = Wu(n)),
                    (r = function (t) {
                      return i(u[t], t, u);
                    });
                }
                return (r = t(n, r, e)), -1 < r ? u[i ? n[r] : r] : T;
              };
            }
            function Hr(t) {
              return pe(function (n) {
                var r = n.length,
                  e = r,
                  u = St.prototype.thru;
                for (t && n.reverse(); e--; ) {
                  var i = n[e];
                  if (typeof i != 'function') throw new ni('Expected a function');
                  if (u && !o && 'wrapper' == ge(i)) var o = new St([], true);
                }
                for (e = o ? e : r; ++e < r; ) var i = n[e], u = ge(i), f = 'wrapper' == u ? ho(i) : T, o = f && Re(f[0]) && 424 == f[1] && !f[4].length && 1 == f[9] ? o[ge(f[0])].apply(o, f[3]) : 1 == i.length && Re(i) ? o[u]() : o.thru(i);
                return function () {
                  var t = arguments,
                    e = t[0];
                  if (o && 1 == t.length && ff(e)) return o.plant(e).value();
                  for (var u = 0, t = r ? n[u].apply(this, t) : e; ++u < r; ) t = n[u].call(this, t);
                  return t;
                };
              });
            }
            function Jr(t, n, r, e, u, i, o, f, c, a) {
              function l() {
                for (var d = arguments.length, y = Ku(d), b = d; b--; ) y[b] = arguments[b];
                if (_) {
                  var x,
                    j = de(l),
                    b = y.length;
                  for (x = 0; b--; ) y[b] === j && ++x;
                }
                if ((e && (y = Br(y, e, u, _)), i && (y = Lr(y, i, o, _)), (d -= x), _ && d < a)) return (j = L(y, j)), ue(t, n, Jr, l.placeholder, r, y, j, f, c, a - d);
                if (((j = h ? r : this), (b = p ? j[t] : t), (d = y.length), f)) {
                  x = y.length;
                  for (var w = Ci(f.length, x), m = Ur(y); w--; ) {
                    var A = f[w];
                    y[w] = Se(A, x) ? m[A] : T;
                  }
                } else v && 1 < d && y.reverse();
                return s && c < d && (y.length = c), this && this !== Tt && this instanceof l && (b = g || Vr(b)), b.apply(j, y);
              }
              var s = 128 & n,
                h = 1 & n,
                p = 2 & n,
                _ = 24 & n,
                v = 512 & n,
                g = p ? T : Vr(t);
              return l;
            }
            function Yr(t, n) {
              return function (r, e) {
                return Bn(r, t, n(e));
              };
            }
            function Qr(t, n) {
              return function (r, e) {
                var u;
                if (r === T && e === T) return n;
                if ((r !== T && (u = r), e !== T)) {
                  if (u === T) return e;
                  typeof r == 'string' || typeof e == 'string' ? ((r = yr(r)), (e = yr(e))) : ((r = dr(r)), (e = dr(e))), (u = t(r, e));
                }
                return u;
              };
            }
            function Xr(n) {
              return pe(function (r) {
                return (
                  (r = c(r, k(ye()))),
                  fr(function (e) {
                    var u = this;
                    return n(r, function (n) {
                      return t(n, u, e);
                    });
                  })
                );
              });
            }
            function te(t, n) {
              n = n === T ? ' ' : yr(n);
              var r = n.length;
              return 2 > r ? (r ? or(n, t) : n) : ((r = or(n, Oi(t / D(n)))), It.test(n) ? Or(M(r), 0, t).join('') : r.slice(0, t));
            }
            function ne(n, r, e, u) {
              function i() {
                for (var r = -1, c = arguments.length, a = -1, l = u.length, s = Ku(l + c), h = this && this !== Tt && this instanceof i ? f : n; ++a < l; ) s[a] = u[a];
                for (; c--; ) s[a++] = arguments[++r];
                return t(h, o ? e : this, s);
              }
              var o = 1 & r,
                f = Vr(n);
              return i;
            }
            function re(t) {
              return function (n, r, e) {
                e && typeof e != 'number' && Oe(n, r, e) && (r = e = T), (n = Au(n)), r === T ? ((r = n), (n = 0)) : (r = Au(r)), (e = e === T ? (n < r ? 1 : -1) : Au(e));
                var u = -1;
                r = Ui(Oi((r - n) / (e || 1)), 0);
                for (var i = Ku(r); r--; ) (i[t ? r : ++u] = n), (n += e);
                return i;
              };
            }
            function ee(t) {
              return function (n, r) {
                return (typeof n == 'string' && typeof r == 'string') || ((n = Su(n)), (r = Su(r))), t(n, r);
              };
            }
            function ue(t, n, r, e, u, i, o, f, c, a) {
              var l = 8 & n,
                s = l ? o : T;
              o = l ? T : o;
              var h = l ? i : T;
              return (i = l ? T : i), (n = (n | (l ? 32 : 64)) & ~(l ? 64 : 32)), 4 & n || (n &= -4), (u = [t, n, u, h, s, i, o, f, c, a]), (r = r.apply(T, u)), Re(t) && yo(r, u), (r.placeholder = e), Ue(r, t, n);
            }
            function ie(t) {
              var n = Yu[t];
              return function (t, r) {
                if (((t = Su(t)), (r = null == r ? 0 : Ci(Eu(r), 292)) && Wi(t))) {
                  var e = (Iu(t) + 'e').split('e'),
                    e = n(e[0] + 'e' + (+e[1] + r)),
                    e = (Iu(e) + 'e').split('e');
                  return +(e[0] + 'e' + (+e[1] - r));
                }
                return n(t);
              };
            }
            function oe(t) {
              return function (n) {
                var r = vo(n);
                return '[object Map]' == r ? W(n) : '[object Set]' == r ? C(n) : E(n, t(n));
              };
            }
            function fe(t, n, r, e, u, i, o, f) {
              var c = 2 & n;
              if (!c && typeof t != 'function') throw new ni('Expected a function');
              var a = e ? e.length : 0;
              if ((a || ((n &= -97), (e = u = T)), (o = o === T ? o : Ui(Eu(o), 0)), (f = f === T ? f : Eu(f)), (a -= u ? u.length : 0), 64 & n)) {
                var l = e,
                  s = u;
                e = u = T;
              }
              var h = c ? T : ho(t);
              return (
                (i = [t, n, r, e, u, l, s, i, o, f]),
                h &&
                  ((r = i[1]), (t = h[1]), (n = r | t), (e = (128 == t && 8 == r) || (128 == t && 256 == r && i[7].length <= h[8]) || (384 == t && h[7].length <= h[8] && 8 == r)), 131 > n || e) &&
                  (1 & t && ((i[2] = h[2]), (n |= 1 & r ? 0 : 4)),
                  (r = h[3]) && ((e = i[3]), (i[3] = e ? Br(e, r, h[4]) : r), (i[4] = e ? L(i[3], '__lodash_placeholder__') : h[4])),
                  (r = h[5]) && ((e = i[5]), (i[5] = e ? Lr(e, r, h[6]) : r), (i[6] = e ? L(i[5], '__lodash_placeholder__') : h[6])),
                  (r = h[7]) && (i[7] = r),
                  128 & t && (i[8] = null == i[8] ? h[8] : Ci(i[8], h[8])),
                  null == i[9] && (i[9] = h[9]),
                  (i[0] = h[0]),
                  (i[1] = n)),
                (t = i[0]),
                (n = i[1]),
                (r = i[2]),
                (e = i[3]),
                (u = i[4]),
                (f = i[9] = i[9] === T ? (c ? 0 : t.length) : Ui(i[9] - a, 0)),
                !f && 24 & n && (n &= -25),
                Ue((h ? co : yo)(n && 1 != n ? (8 == n || 16 == n ? Kr(t, n, f) : (32 != n && 33 != n) || u.length ? Jr.apply(T, i) : ne(t, n, r, e)) : Pr(t, n, r), i), t, n)
              );
            }
            function ce(t, n, r, e) {
              return t === T || (lu(t, ei[r]) && !oi.call(e, r)) ? n : t;
            }
            function ae(t, n, r, e, u, i) {
              return du(t) && du(n) && (i.set(n, t), Yn(t, n, T, ae, i), i.delete(n)), t;
            }
            function le(t) {
              return xu(t) ? T : t;
            }
            function se(t, n, r, e, u, i) {
              var o = 1 & r,
                f = t.length,
                c = n.length;
              if (f != c && !(o && c > f)) return false;
              if ((c = i.get(t)) && i.get(n)) return c == n;
              var c = -1,
                a = true,
                l = 2 & r ? new Ft() : T;
              for (i.set(t, n), i.set(n, t); ++c < f; ) {
                var s = t[c],
                  p = n[c];
                if (e) var _ = o ? e(p, s, c, n, t, i) : e(s, p, c, t, n, i);
                if (_ !== T) {
                  if (_) continue;
                  a = false;
                  break;
                }
                if (l) {
                  if (
                    !h(n, function (t, n) {
                      if (!O(l, n) && (s === t || u(s, t, r, e, i))) return l.push(n);
                    })
                  ) {
                    a = false;
                    break;
                  }
                } else if (s !== p && !u(s, p, r, e, i)) {
                  a = false;
                  break;
                }
              }
              return i.delete(t), i.delete(n), a;
            }
            function he(t, n, r, e, u, i, o) {
              switch (r) {
                case '[object DataView]':
                  if (t.byteLength != n.byteLength || t.byteOffset != n.byteOffset) break;
                  (t = t.buffer), (n = n.buffer);
                case '[object ArrayBuffer]':
                  if (t.byteLength != n.byteLength || !i(new vi(t), new vi(n))) break;
                  return true;
                case '[object Boolean]':
                case '[object Date]':
                case '[object Number]':
                  return lu(+t, +n);
                case '[object Error]':
                  return t.name == n.name && t.message == n.message;
                case '[object RegExp]':
                case '[object String]':
                  return t == n + '';
                case '[object Map]':
                  var f = W;
                case '[object Set]':
                  if ((f || (f = U), t.size != n.size && !(1 & e))) break;
                  return (r = o.get(t)) ? r == n : ((e |= 2), o.set(t, n), (n = se(f(t), f(n), e, u, i, o)), o.delete(t), n);
                case '[object Symbol]':
                  if (no) return no.call(t) == no.call(n);
              }
              return false;
            }
            function pe(t) {
              return xo(Be(t, T, Ze), t + '');
            }
            function _e(t) {
              return Sn(t, Wu, po);
            }
            function ve(t) {
              return Sn(t, Bu, _o);
            }
            function ge(t) {
              for (var n = t.name + '', r = Gi[n], e = oi.call(Gi, n) ? r.length : 0; e--; ) {
                var u = r[e],
                  i = u.func;
                if (null == i || i == t) return u.name;
              }
              return n;
            }
            function de(t) {
              return (oi.call(mt, 'placeholder') ? mt : t).placeholder;
            }
            function ye() {
              var t = mt.iteratee || Fu,
                t = t === Fu ? qn : t;
              return arguments.length ? t(arguments[0], arguments[1]) : t;
            }
            function be(t, n) {
              var r = t.__data__,
                e = typeof n;
              return ('string' == e || 'number' == e || 'symbol' == e || 'boolean' == e ? '__proto__' !== n : null === n) ? r[typeof n == 'string' ? 'string' : 'hash'] : r.map;
            }
            function xe(t) {
              for (var n = Wu(t), r = n.length; r--; ) {
                var e = n[r],
                  u = t[e];
                n[r] = [e, u, u === u && !du(u)];
              }
              return n;
            }
            function je(t, n) {
              var r = null == t ? T : t[n];
              return Fn(r) ? r : T;
            }
            function we(t, n, r) {
              n = Sr(n, t);
              for (var e = -1, u = n.length, i = false; ++e < u; ) {
                var o = Me(n[e]);
                if (!(i = null != t && r(t, o))) break;
                t = t[o];
              }
              return i || ++e != u ? i : ((u = null == t ? 0 : t.length), !!u && gu(u) && Se(o, u) && (ff(t) || of(t)));
            }
            function me(t) {
              var n = t.length,
                r = new t.constructor(n);
              return n && 'string' == typeof t[0] && oi.call(t, 'index') && ((r.index = t.index), (r.input = t.input)), r;
            }
            function Ae(t) {
              return typeof t.constructor != 'function' || ze(t) ? {} : eo(di(t));
            }
            function Ee(t, n, r) {
              var e = t.constructor;
              switch (n) {
                case '[object ArrayBuffer]':
                  return Rr(t);
                case '[object Boolean]':
                case '[object Date]':
                  return new e(+t);
                case '[object DataView]':
                  return (n = r ? Rr(t.buffer) : t.buffer), new t.constructor(n, t.byteOffset, t.byteLength);
                case '[object Float32Array]':
                case '[object Float64Array]':
                case '[object Int8Array]':
                case '[object Int16Array]':
                case '[object Int32Array]':
                case '[object Uint8Array]':
                case '[object Uint8ClampedArray]':
                case '[object Uint16Array]':
                case '[object Uint32Array]':
                  return zr(t, r);
                case '[object Map]':
                  return new e();
                case '[object Number]':
                case '[object String]':
                  return new e(t);
                case '[object RegExp]':
                  return (n = new t.constructor(t.source, pt.exec(t))), (n.lastIndex = t.lastIndex), n;
                case '[object Set]':
                  return new e();
                case '[object Symbol]':
                  return no ? Qu(no.call(t)) : {};
              }
            }
            function ke(t) {
              return ff(t) || of(t) || !!(ji && t && t[ji]);
            }
            function Se(t, n) {
              var r = typeof t;
              return (n = null == n ? 9007199254740991 : n), !!n && ('number' == r || ('symbol' != r && yt.test(t))) && -1 < t && 0 == t % 1 && t < n;
            }
            function Oe(t, n, r) {
              if (!du(r)) return false;
              var e = typeof n;
              return !!('number' == e ? su(r) && Se(n, r.length) : 'string' == e && n in r) && lu(r[n], t);
            }
            function Ie(t, n) {
              if (ff(t)) return false;
              var r = typeof t;
              return !('number' != r && 'symbol' != r && 'boolean' != r && null != t && !wu(t)) || tt.test(t) || !X.test(t) || (null != n && t in Qu(n));
            }
            function Re(t) {
              var n = ge(t),
                r = mt[n];
              return typeof r == 'function' && n in Lt.prototype && (t === r || ((n = ho(r)), !!n && t === n[0]));
            }
            function ze(t) {
              var n = t && t.constructor;
              return t === ((typeof n == 'function' && n.prototype) || ei);
            }
            function We(t, n) {
              return function (r) {
                return null != r && r[t] === n && (n !== T || t in Qu(r));
              };
            }
            function Be(n, r, e) {
              return (
                (r = Ui(r === T ? n.length - 1 : r, 0)),
                function () {
                  for (var u = arguments, i = -1, o = Ui(u.length - r, 0), f = Ku(o); ++i < o; ) f[i] = u[r + i];
                  for (i = -1, o = Ku(r + 1); ++i < r; ) o[i] = u[i];
                  return (o[r] = e(f)), t(n, this, o);
                }
              );
            }
            function Le(t, n) {
              if (('constructor' !== n || 'function' != typeof t[n]) && '__proto__' != n) return t[n];
            }
            function Ue(t, n, r) {
              var e = n + '';
              n = xo;
              var u,
                i = $e;
              return (u = (u = e.match(ct)) ? u[1].split(at) : []), (r = i(u, r)), (i = r.length) && ((u = i - 1), (r[u] = (1 < i ? '& ' : '') + r[u]), (r = r.join(2 < i ? ', ' : ' ')), (e = e.replace(ft, '{\n/* [wrapped with ' + r + '] */\n'))), n(t, e);
            }
            function Ce(t) {
              var n = 0,
                r = 0;
              return function () {
                var e = Di(),
                  u = 16 - (e - r);
                if (((r = e), 0 < u)) {
                  if (800 <= ++n) return arguments[0];
                } else n = 0;
                return t.apply(T, arguments);
              };
            }
            function De(t, n) {
              var r = -1,
                e = t.length,
                u = e - 1;
              for (n = n === T ? e : n; ++r < n; ) {
                var e = ir(r, u),
                  i = t[e];
                (t[e] = t[r]), (t[r] = i);
              }
              return (t.length = n), t;
            }
            function Me(t) {
              if (typeof t == 'string' || wu(t)) return t;
              var n = t + '';
              return '0' == n && 1 / t == -$ ? '-0' : n;
            }
            function Te(t) {
              if (null != t) {
                try {
                  return ii.call(t);
                } catch (t) {}
                return t + '';
              }
              return '';
            }
            function $e(t, n) {
              return (
                r(N, function (r) {
                  var e = '_.' + r[0];
                  n & r[1] && !o(t, e) && t.push(e);
                }),
                t.sort()
              );
            }
            function Fe(t) {
              if (t instanceof Lt) return t.clone();
              var n = new St(t.__wrapped__, t.__chain__);
              return (n.__actions__ = Ur(t.__actions__)), (n.__index__ = t.__index__), (n.__values__ = t.__values__), n;
            }
            function Ne(t, n, r) {
              var e = null == t ? 0 : t.length;
              return e ? ((r = null == r ? 0 : Eu(r)), 0 > r && (r = Ui(e + r, 0)), _(t, ye(n, 3), r)) : -1;
            }
            function Pe(t, n, r) {
              var e = null == t ? 0 : t.length;
              if (!e) return -1;
              var u = e - 1;
              return r !== T && ((u = Eu(r)), (u = 0 > r ? Ui(e + u, 0) : Ci(u, e - 1))), _(t, ye(n, 3), u, true);
            }
            function Ze(t) {
              return (null == t ? 0 : t.length) ? wn(t, 1) : [];
            }
            function qe(t) {
              return t && t.length ? t[0] : T;
            }
            function Ve(t) {
              var n = null == t ? 0 : t.length;
              return n ? t[n - 1] : T;
            }
            function Ke(t, n) {
              return t && t.length && n && n.length ? er(t, n) : t;
            }
            function Ge(t) {
              return null == t ? t : $i.call(t);
            }
            function He(t) {
              if (!t || !t.length) return [];
              var n = 0;
              return (
                (t = i(t, function (t) {
                  if (hu(t)) return (n = Ui(t.length, n)), true;
                })),
                A(n, function (n) {
                  return c(t, b(n));
                })
              );
            }
            function Je(n, r) {
              if (!n || !n.length) return [];
              var e = He(n);
              return null == r
                ? e
                : c(e, function (n) {
                    return t(r, T, n);
                  });
            }
            function Ye(t) {
              return (t = mt(t)), (t.__chain__ = true), t;
            }
            function Qe(t, n) {
              return n(t);
            }
            function Xe() {
              return this;
            }
            function tu(t, n) {
              return (ff(t) ? r : uo)(t, ye(n, 3));
            }
            function nu(t, n) {
              return (ff(t) ? e : io)(t, ye(n, 3));
            }
            function ru(t, n) {
              return (ff(t) ? c : Gn)(t, ye(n, 3));
            }
            function eu(t, n, r) {
              return (n = r ? T : n), (n = t && null == n ? t.length : n), fe(t, 128, T, T, T, T, n);
            }
            function uu(t, n) {
              var r;
              if (typeof n != 'function') throw new ni('Expected a function');
              return (
                (t = Eu(t)),
                function () {
                  return 0 < --t && (r = n.apply(this, arguments)), 1 >= t && (n = T), r;
                }
              );
            }
            function iu(t, n, r) {
              return (n = r ? T : n), (t = fe(t, 8, T, T, T, T, T, n)), (t.placeholder = iu.placeholder), t;
            }
            function ou(t, n, r) {
              return (n = r ? T : n), (t = fe(t, 16, T, T, T, T, T, n)), (t.placeholder = ou.placeholder), t;
            }
            function fu(t, n, r) {
              function e(n) {
                var r = c,
                  e = a;
                return (c = a = T), (_ = n), (s = t.apply(e, r));
              }
              function u(t) {
                var r = t - p;
                return (t -= _), p === T || r >= n || 0 > r || (g && t >= l);
              }
              function i() {
                var t = Go();
                if (u(t)) return o(t);
                var r,
                  e = bo;
                (r = t - _), (t = n - (t - p)), (r = g ? Ci(t, l - r) : t), (h = e(i, r));
              }
              function o(t) {
                return (h = T), d && c ? e(t) : ((c = a = T), s);
              }
              function f() {
                var t = Go(),
                  r = u(t);
                if (((c = arguments), (a = this), (p = t), r)) {
                  if (h === T) return (_ = t = p), (h = bo(i, n)), v ? e(t) : s;
                  if (g) return lo(h), (h = bo(i, n)), e(p);
                }
                return h === T && (h = bo(i, n)), s;
              }
              var c,
                a,
                l,
                s,
                h,
                p,
                _ = 0,
                v = false,
                g = false,
                d = true;
              if (typeof t != 'function') throw new ni('Expected a function');
              return (
                (n = Su(n) || 0),
                du(r) && ((v = !!r.leading), (l = (g = 'maxWait' in r) ? Ui(Su(r.maxWait) || 0, n) : l), (d = 'trailing' in r ? !!r.trailing : d)),
                (f.cancel = function () {
                  h !== T && lo(h), (_ = 0), (c = p = a = h = T);
                }),
                (f.flush = function () {
                  return h === T ? s : o(Go());
                }),
                f
              );
            }
            function cu(t, n) {
              function r() {
                var e = arguments,
                  u = n ? n.apply(this, e) : e[0],
                  i = r.cache;
                return i.has(u) ? i.get(u) : ((e = t.apply(this, e)), (r.cache = i.set(u, e) || i), e);
              }
              if (typeof t != 'function' || (null != n && typeof n != 'function')) throw new ni('Expected a function');
              return (r.cache = new (cu.Cache || $t)()), r;
            }
            function au(t) {
              if (typeof t != 'function') throw new ni('Expected a function');
              return function () {
                var n = arguments;
                switch (n.length) {
                  case 0:
                    return !t.call(this);
                  case 1:
                    return !t.call(this, n[0]);
                  case 2:
                    return !t.call(this, n[0], n[1]);
                  case 3:
                    return !t.call(this, n[0], n[1], n[2]);
                }
                return !t.apply(this, n);
              };
            }
            function lu(t, n) {
              return t === n || (t !== t && n !== n);
            }
            function su(t) {
              return null != t && gu(t.length) && !_u(t);
            }
            function hu(t) {
              return yu(t) && su(t);
            }
            function pu(t) {
              if (!yu(t)) return false;
              var n = On(t);
              return '[object Error]' == n || '[object DOMException]' == n || (typeof t.message == 'string' && typeof t.name == 'string' && !xu(t));
            }
            function _u(t) {
              return !!du(t) && ((t = On(t)), '[object Function]' == t || '[object GeneratorFunction]' == t || '[object AsyncFunction]' == t || '[object Proxy]' == t);
            }
            function vu(t) {
              return typeof t == 'number' && t == Eu(t);
            }
            function gu(t) {
              return typeof t == 'number' && -1 < t && 0 == t % 1 && 9007199254740991 >= t;
            }
            function du(t) {
              var n = typeof t;
              return null != t && ('object' == n || 'function' == n);
            }
            function yu(t) {
              return null != t && typeof t == 'object';
            }
            function bu(t) {
              return typeof t == 'number' || (yu(t) && '[object Number]' == On(t));
            }
            function xu(t) {
              return !(!yu(t) || '[object Object]' != On(t)) && ((t = di(t)), null === t || ((t = oi.call(t, 'constructor') && t.constructor), typeof t == 'function' && t instanceof t && ii.call(t) == li));
            }
            function ju(t) {
              return typeof t == 'string' || (!ff(t) && yu(t) && '[object String]' == On(t));
            }
            function wu(t) {
              return typeof t == 'symbol' || (yu(t) && '[object Symbol]' == On(t));
            }
            function mu(t) {
              if (!t) return [];
              if (su(t)) return ju(t) ? M(t) : Ur(t);
              if (wi && t[wi]) {
                t = t[wi]();
                for (var n, r = []; !(n = t.next()).done; ) r.push(n.value);
                return r;
              }
              return (n = vo(t)), ('[object Map]' == n ? W : '[object Set]' == n ? U : Uu)(t);
            }
            function Au(t) {
              return t ? ((t = Su(t)), t === $ || t === -$ ? 17976931348623157e292 * (0 > t ? -1 : 1) : t === t ? t : 0) : 0 === t ? t : 0;
            }
            function Eu(t) {
              t = Au(t);
              var n = t % 1;
              return t === t ? (n ? t - n : t) : 0;
            }
            function ku(t) {
              return t ? pn(Eu(t), 0, 4294967295) : 0;
            }
            function Su(t) {
              if (typeof t == 'number') return t;
              if (wu(t)) return F;
              if ((du(t) && ((t = typeof t.valueOf == 'function' ? t.valueOf() : t), (t = du(t) ? t + '' : t)), typeof t != 'string')) return 0 === t ? t : +t;
              t = t.replace(ut, '');
              var n = vt.test(t);
              return n || dt.test(t) ? Ct(t.slice(2), n ? 2 : 8) : _t.test(t) ? F : +t;
            }
            function Ou(t) {
              return Cr(t, Bu(t));
            }
            function Iu(t) {
              return null == t ? '' : yr(t);
            }
            function Ru(t, n, r) {
              return (t = null == t ? T : kn(t, n)), t === T ? r : t;
            }
            function zu(t, n) {
              return null != t && we(t, n, zn);
            }
            function Wu(t) {
              return su(t) ? Zt(t) : Vn(t);
            }
            function Bu(t) {
              if (su(t)) t = Zt(t, true);
              else if (du(t)) {
                var n,
                  r = ze(t),
                  e = [];
                for (n in t) ('constructor' != n || (!r && oi.call(t, n))) && e.push(n);
                t = e;
              } else {
                if (((n = []), null != t)) for (r in Qu(t)) n.push(r);
                t = n;
              }
              return t;
            }
            function Lu(t, n) {
              if (null == t) return {};
              var r = c(ve(t), function (t) {
                return [t];
              });
              return (
                (n = ye(n)),
                nr(t, r, function (t, r) {
                  return n(t, r[0]);
                })
              );
            }
            function Uu(t) {
              return null == t ? [] : S(t, Wu(t));
            }
            function Cu(t) {
              return $f(Iu(t).toLowerCase());
            }
            function Du(t) {
              return (t = Iu(t)) && t.replace(bt, Qt).replace(kt, '');
            }
            function Mu(t, n, r) {
              return (t = Iu(t)), (n = r ? T : n), n === T ? (Rt.test(t) ? t.match(Ot) || [] : t.match(lt) || []) : t.match(n) || [];
            }
            function Tu(t) {
              return function () {
                return t;
              };
            }
            function $u(t) {
              return t;
            }
            function Fu(t) {
              return qn(typeof t == 'function' ? t : _n(t, 1));
            }
            function Nu(t, n, e) {
              var u = Wu(n),
                i = En(n, u);
              null != e || (du(n) && (i.length || !u.length)) || ((e = n), (n = t), (t = this), (i = En(n, Wu(n))));
              var o = !(du(e) && 'chain' in e && !e.chain),
                f = _u(t);
              return (
                r(i, function (r) {
                  var e = n[r];
                  (t[r] = e),
                    f &&
                      (t.prototype[r] = function () {
                        var n = this.__chain__;
                        if (o || n) {
                          var r = t(this.__wrapped__);
                          return (r.__actions__ = Ur(this.__actions__)).push({ func: e, args: arguments, thisArg: t }), (r.__chain__ = n), r;
                        }
                        return e.apply(t, a([this.value()], arguments));
                      });
                }),
                t
              );
            }
            function Pu() {}
            function Zu(t) {
              return Ie(t) ? b(Me(t)) : rr(t);
            }
            function qu() {
              return [];
            }
            function Vu() {
              return false;
            }
            wt = null == wt ? Tt : nn.defaults(Tt.Object(), wt, nn.pick(Tt, zt));
            var Ku = wt.Array,
              Gu = wt.Date,
              Hu = wt.Error,
              Ju = wt.Function,
              Yu = wt.Math,
              Qu = wt.Object,
              Xu = wt.RegExp,
              ti = wt.String,
              ni = wt.TypeError,
              ri = Ku.prototype,
              ei = Qu.prototype,
              ui = wt['__core-js_shared__'],
              ii = Ju.prototype.toString,
              oi = ei.hasOwnProperty,
              fi = 0,
              ci = (function () {
                var t = /[^.]+$/.exec((ui && ui.keys && ui.keys.IE_PROTO) || '');
                return t ? 'Symbol(src)_1.' + t : '';
              })(),
              ai = ei.toString,
              li = ii.call(Qu),
              si = Tt._,
              hi = Xu(
                '^' +
                  ii
                    .call(oi)
                    .replace(rt, '\\$&')
                    .replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, '$1.*?') +
                  '$'
              ),
              pi = Nt ? wt.Buffer : T,
              _i = wt.Symbol,
              vi = wt.Uint8Array,
              gi = pi ? pi.g : T,
              di = B(Qu.getPrototypeOf, Qu),
              yi = Qu.create,
              bi = ei.propertyIsEnumerable,
              xi = ri.splice,
              ji = _i ? _i.isConcatSpreadable : T,
              wi = _i ? _i.iterator : T,
              mi = _i ? _i.toStringTag : T,
              Ai = (function () {
                try {
                  var t = je(Qu, 'defineProperty');
                  return t({}, '', {}), t;
                } catch (t) {}
              })(),
              Ei = wt.clearTimeout !== Tt.clearTimeout && wt.clearTimeout,
              ki = Gu && Gu.now !== Tt.Date.now && Gu.now,
              Si = wt.setTimeout !== Tt.setTimeout && wt.setTimeout,
              Oi = Yu.ceil,
              Ii = Yu.floor,
              Ri = Qu.getOwnPropertySymbols,
              zi = pi ? pi.isBuffer : T,
              Wi = wt.isFinite,
              Bi = ri.join,
              Li = B(Qu.keys, Qu),
              Ui = Yu.max,
              Ci = Yu.min,
              Di = Gu.now,
              Mi = wt.parseInt,
              Ti = Yu.random,
              $i = ri.reverse,
              Fi = je(wt, 'DataView'),
              Ni = je(wt, 'Map'),
              Pi = je(wt, 'Promise'),
              Zi = je(wt, 'Set'),
              qi = je(wt, 'WeakMap'),
              Vi = je(Qu, 'create'),
              Ki = qi && new qi(),
              Gi = {},
              Hi = Te(Fi),
              Ji = Te(Ni),
              Yi = Te(Pi),
              Qi = Te(Zi),
              Xi = Te(qi),
              to = _i ? _i.prototype : T,
              no = to ? to.valueOf : T,
              ro = to ? to.toString : T,
              eo = (function () {
                function t() {}
                return function (n) {
                  return du(n) ? (yi ? yi(n) : ((t.prototype = n), (n = new t()), (t.prototype = T), n)) : {};
                };
              })();
            (mt.templateSettings = { escape: J, evaluate: Y, interpolate: Q, variable: '', imports: { _: mt } }),
              (mt.prototype = At.prototype),
              (mt.prototype.constructor = mt),
              (St.prototype = eo(At.prototype)),
              (St.prototype.constructor = St),
              (Lt.prototype = eo(At.prototype)),
              (Lt.prototype.constructor = Lt),
              (Dt.prototype.clear = function () {
                (this.__data__ = Vi ? Vi(null) : {}), (this.size = 0);
              }),
              (Dt.prototype.delete = function (t) {
                return (t = this.has(t) && delete this.__data__[t]), (this.size -= t ? 1 : 0), t;
              }),
              (Dt.prototype.get = function (t) {
                var n = this.__data__;
                return Vi ? ((t = n[t]), '__lodash_hash_undefined__' === t ? T : t) : oi.call(n, t) ? n[t] : T;
              }),
              (Dt.prototype.has = function (t) {
                var n = this.__data__;
                return Vi ? n[t] !== T : oi.call(n, t);
              }),
              (Dt.prototype.set = function (t, n) {
                var r = this.__data__;
                return (this.size += this.has(t) ? 0 : 1), (r[t] = Vi && n === T ? '__lodash_hash_undefined__' : n), this;
              }),
              (Mt.prototype.clear = function () {
                (this.__data__ = []), (this.size = 0);
              }),
              (Mt.prototype.delete = function (t) {
                var n = this.__data__;
                return (t = fn(n, t)), !(0 > t) && (t == n.length - 1 ? n.pop() : xi.call(n, t, 1), --this.size, true);
              }),
              (Mt.prototype.get = function (t) {
                var n = this.__data__;
                return (t = fn(n, t)), 0 > t ? T : n[t][1];
              }),
              (Mt.prototype.has = function (t) {
                return -1 < fn(this.__data__, t);
              }),
              (Mt.prototype.set = function (t, n) {
                var r = this.__data__,
                  e = fn(r, t);
                return 0 > e ? (++this.size, r.push([t, n])) : (r[e][1] = n), this;
              }),
              ($t.prototype.clear = function () {
                (this.size = 0), (this.__data__ = { hash: new Dt(), map: new (Ni || Mt)(), string: new Dt() });
              }),
              ($t.prototype.delete = function (t) {
                return (t = be(this, t).delete(t)), (this.size -= t ? 1 : 0), t;
              }),
              ($t.prototype.get = function (t) {
                return be(this, t).get(t);
              }),
              ($t.prototype.has = function (t) {
                return be(this, t).has(t);
              }),
              ($t.prototype.set = function (t, n) {
                var r = be(this, t),
                  e = r.size;
                return r.set(t, n), (this.size += r.size == e ? 0 : 1), this;
              }),
              (Ft.prototype.add = Ft.prototype.push =
                function (t) {
                  return this.__data__.set(t, '__lodash_hash_undefined__'), this;
                }),
              (Ft.prototype.has = function (t) {
                return this.__data__.has(t);
              }),
              (Pt.prototype.clear = function () {
                (this.__data__ = new Mt()), (this.size = 0);
              }),
              (Pt.prototype.delete = function (t) {
                var n = this.__data__;
                return (t = n.delete(t)), (this.size = n.size), t;
              }),
              (Pt.prototype.get = function (t) {
                return this.__data__.get(t);
              }),
              (Pt.prototype.has = function (t) {
                return this.__data__.has(t);
              }),
              (Pt.prototype.set = function (t, n) {
                var r = this.__data__;
                if (r instanceof Mt) {
                  var e = r.__data__;
                  if (!Ni || 199 > e.length) return e.push([t, n]), (this.size = ++r.size), this;
                  r = this.__data__ = new $t(e);
                }
                return r.set(t, n), (this.size = r.size), this;
              });
            var uo = Fr(mn),
              io = Fr(An, true),
              oo = Nr(),
              fo = Nr(true),
              co = Ki
                ? function (t, n) {
                    return Ki.set(t, n), t;
                  }
                : $u,
              ao = Ai
                ? function (t, n) {
                    return Ai(t, 'toString', { configurable: true, enumerable: false, value: Tu(n), writable: true });
                  }
                : $u,
              lo =
                Ei ||
                function (t) {
                  return Tt.clearTimeout(t);
                },
              so =
                Zi && 1 / U(new Zi([, -0]))[1] == $
                  ? function (t) {
                      return new Zi(t);
                    }
                  : Pu,
              ho = Ki
                ? function (t) {
                    return Ki.get(t);
                  }
                : Pu,
              po = Ri
                ? function (t) {
                    return null == t
                      ? []
                      : ((t = Qu(t)),
                        i(Ri(t), function (n) {
                          return bi.call(t, n);
                        }));
                  }
                : qu,
              _o = Ri
                ? function (t) {
                    for (var n = []; t; ) a(n, po(t)), (t = di(t));
                    return n;
                  }
                : qu,
              vo = On;
            ((Fi && '[object DataView]' != vo(new Fi(new ArrayBuffer(1)))) || (Ni && '[object Map]' != vo(new Ni())) || (Pi && '[object Promise]' != vo(Pi.resolve())) || (Zi && '[object Set]' != vo(new Zi())) || (qi && '[object WeakMap]' != vo(new qi()))) &&
              (vo = function (t) {
                var n = On(t);
                if ((t = (t = '[object Object]' == n ? t.constructor : T) ? Te(t) : ''))
                  switch (t) {
                    case Hi:
                      return '[object DataView]';
                    case Ji:
                      return '[object Map]';
                    case Yi:
                      return '[object Promise]';
                    case Qi:
                      return '[object Set]';
                    case Xi:
                      return '[object WeakMap]';
                  }
                return n;
              });
            var go = ui ? _u : Vu,
              yo = Ce(co),
              bo =
                Si ||
                function (t, n) {
                  return Tt.setTimeout(t, n);
                },
              xo = Ce(ao),
              jo = (function (t) {
                t = cu(t, function (t) {
                  return 500 === n.size && n.clear(), t;
                });
                var n = t.cache;
                return t;
              })(function (t) {
                var n = [];
                return (
                  46 === t.charCodeAt(0) && n.push(''),
                  t.replace(nt, function (t, r, e, u) {
                    n.push(e ? u.replace(st, '$1') : r || t);
                  }),
                  n
                );
              }),
              wo = fr(function (t, n) {
                return hu(t) ? yn(t, wn(n, 1, hu, true)) : [];
              }),
              mo = fr(function (t, n) {
                var r = Ve(n);
                return hu(r) && (r = T), hu(t) ? yn(t, wn(n, 1, hu, true), ye(r, 2)) : [];
              }),
              Ao = fr(function (t, n) {
                var r = Ve(n);
                return hu(r) && (r = T), hu(t) ? yn(t, wn(n, 1, hu, true), T, r) : [];
              }),
              Eo = fr(function (t) {
                var n = c(t, Er);
                return n.length && n[0] === t[0] ? Wn(n) : [];
              }),
              ko = fr(function (t) {
                var n = Ve(t),
                  r = c(t, Er);
                return n === Ve(r) ? (n = T) : r.pop(), r.length && r[0] === t[0] ? Wn(r, ye(n, 2)) : [];
              }),
              So = fr(function (t) {
                var n = Ve(t),
                  r = c(t, Er);
                return (n = typeof n == 'function' ? n : T) && r.pop(), r.length && r[0] === t[0] ? Wn(r, T, n) : [];
              }),
              Oo = fr(Ke),
              Io = pe(function (t, n) {
                var r = null == t ? 0 : t.length,
                  e = hn(t, n);
                return (
                  ur(
                    t,
                    c(n, function (t) {
                      return Se(t, r) ? +t : t;
                    }).sort(Wr)
                  ),
                  e
                );
              }),
              Ro = fr(function (t) {
                return br(wn(t, 1, hu, true));
              }),
              zo = fr(function (t) {
                var n = Ve(t);
                return hu(n) && (n = T), br(wn(t, 1, hu, true), ye(n, 2));
              }),
              Wo = fr(function (t) {
                var n = Ve(t),
                  n = typeof n == 'function' ? n : T;
                return br(wn(t, 1, hu, true), T, n);
              }),
              Bo = fr(function (t, n) {
                return hu(t) ? yn(t, n) : [];
              }),
              Lo = fr(function (t) {
                return mr(i(t, hu));
              }),
              Uo = fr(function (t) {
                var n = Ve(t);
                return hu(n) && (n = T), mr(i(t, hu), ye(n, 2));
              }),
              Co = fr(function (t) {
                var n = Ve(t),
                  n = typeof n == 'function' ? n : T;
                return mr(i(t, hu), T, n);
              }),
              Do = fr(He),
              Mo = fr(function (t) {
                var n = t.length,
                  n = 1 < n ? t[n - 1] : T,
                  n = typeof n == 'function' ? (t.pop(), n) : T;
                return Je(t, n);
              }),
              To = pe(function (t) {
                function n(n) {
                  return hn(n, t);
                }
                var r = t.length,
                  e = r ? t[0] : 0,
                  u = this.__wrapped__;
                return !(1 < r || this.__actions__.length) && u instanceof Lt && Se(e)
                  ? ((u = u.slice(e, +e + (r ? 1 : 0))),
                    u.__actions__.push({ func: Qe, args: [n], thisArg: T }),
                    new St(u, this.__chain__).thru(function (t) {
                      return r && !t.length && t.push(T), t;
                    }))
                  : this.thru(n);
              }),
              $o = Tr(function (t, n, r) {
                oi.call(t, r) ? ++t[r] : sn(t, r, 1);
              }),
              Fo = Gr(Ne),
              No = Gr(Pe),
              Po = Tr(function (t, n, r) {
                oi.call(t, r) ? t[r].push(n) : sn(t, r, [n]);
              }),
              Zo = fr(function (n, r, e) {
                var u = -1,
                  i = typeof r == 'function',
                  o = su(n) ? Ku(n.length) : [];
                return (
                  uo(n, function (n) {
                    o[++u] = i ? t(r, n, e) : Ln(n, r, e);
                  }),
                  o
                );
              }),
              qo = Tr(function (t, n, r) {
                sn(t, r, n);
              }),
              Vo = Tr(
                function (t, n, r) {
                  t[r ? 0 : 1].push(n);
                },
                function () {
                  return [[], []];
                }
              ),
              Ko = fr(function (t, n) {
                if (null == t) return [];
                var r = n.length;
                return 1 < r && Oe(t, n[0], n[1]) ? (n = []) : 2 < r && Oe(n[0], n[1], n[2]) && (n = [n[0]]), Xn(t, wn(n, 1), []);
              }),
              Go =
                ki ||
                function () {
                  return Tt.Date.now();
                },
              Ho = fr(function (t, n, r) {
                var e = 1;
                if (r.length)
                  var u = L(r, de(Ho)),
                    e = 32 | e;
                return fe(t, e, n, r, u);
              }),
              Jo = fr(function (t, n, r) {
                var e = 3;
                if (r.length)
                  var u = L(r, de(Jo)),
                    e = 32 | e;
                return fe(n, e, t, r, u);
              }),
              Yo = fr(function (t, n) {
                return dn(t, 1, n);
              }),
              Qo = fr(function (t, n, r) {
                return dn(t, Su(n) || 0, r);
              });
            cu.Cache = $t;
            var Xo = fr(function (n, r) {
                r = 1 == r.length && ff(r[0]) ? c(r[0], k(ye())) : c(wn(r, 1), k(ye()));
                var e = r.length;
                return fr(function (u) {
                  for (var i = -1, o = Ci(u.length, e); ++i < o; ) u[i] = r[i].call(this, u[i]);
                  return t(n, this, u);
                });
              }),
              tf = fr(function (t, n) {
                return fe(t, 32, T, n, L(n, de(tf)));
              }),
              nf = fr(function (t, n) {
                return fe(t, 64, T, n, L(n, de(nf)));
              }),
              rf = pe(function (t, n) {
                return fe(t, 256, T, T, T, n);
              }),
              ef = ee(In),
              uf = ee(function (t, n) {
                return t >= n;
              }),
              of = Un(
                (function () {
                  return arguments;
                })()
              )
                ? Un
                : function (t) {
                    return yu(t) && oi.call(t, 'callee') && !bi.call(t, 'callee');
                  },
              ff = Ku.isArray,
              cf = qt ? k(qt) : Cn,
              af = zi || Vu,
              lf = Vt ? k(Vt) : Dn,
              sf = Kt ? k(Kt) : Tn,
              hf = Gt ? k(Gt) : Nn,
              pf = Ht ? k(Ht) : Pn,
              _f = Jt ? k(Jt) : Zn,
              vf = ee(Kn),
              gf = ee(function (t, n) {
                return t <= n;
              }),
              df = $r(function (t, n) {
                if (ze(n) || su(n)) Cr(n, Wu(n), t);
                else for (var r in n) oi.call(n, r) && on(t, r, n[r]);
              }),
              yf = $r(function (t, n) {
                Cr(n, Bu(n), t);
              }),
              bf = $r(function (t, n, r, e) {
                Cr(n, Bu(n), t, e);
              }),
              xf = $r(function (t, n, r, e) {
                Cr(n, Wu(n), t, e);
              }),
              jf = pe(hn),
              wf = fr(function (t, n) {
                t = Qu(t);
                var r = -1,
                  e = n.length,
                  u = 2 < e ? n[2] : T;
                for (u && Oe(n[0], n[1], u) && (e = 1); ++r < e; )
                  for (var u = n[r], i = Bu(u), o = -1, f = i.length; ++o < f; ) {
                    var c = i[o],
                      a = t[c];
                    (a === T || (lu(a, ei[c]) && !oi.call(t, c))) && (t[c] = u[c]);
                  }
                return t;
              }),
              mf = fr(function (n) {
                return n.push(T, ae), t(Of, T, n);
              }),
              Af = Yr(function (t, n, r) {
                null != n && typeof n.toString != 'function' && (n = ai.call(n)), (t[n] = r);
              }, Tu($u)),
              Ef = Yr(function (t, n, r) {
                null != n && typeof n.toString != 'function' && (n = ai.call(n)), oi.call(t, n) ? t[n].push(r) : (t[n] = [r]);
              }, ye),
              kf = fr(Ln),
              Sf = $r(function (t, n, r) {
                Yn(t, n, r);
              }),
              Of = $r(function (t, n, r, e) {
                Yn(t, n, r, e);
              }),
              If = pe(function (t, n) {
                var r = {};
                if (null == t) return r;
                var e = false;
                (n = c(n, function (n) {
                  return (n = Sr(n, t)), e || (e = 1 < n.length), n;
                })),
                  Cr(t, ve(t), r),
                  e && (r = _n(r, 7, le));
                for (var u = n.length; u--; ) xr(r, n[u]);
                return r;
              }),
              Rf = pe(function (t, n) {
                return null == t ? {} : tr(t, n);
              }),
              zf = oe(Wu),
              Wf = oe(Bu),
              Bf = qr(function (t, n, r) {
                return (n = n.toLowerCase()), t + (r ? Cu(n) : n);
              }),
              Lf = qr(function (t, n, r) {
                return t + (r ? '-' : '') + n.toLowerCase();
              }),
              Uf = qr(function (t, n, r) {
                return t + (r ? ' ' : '') + n.toLowerCase();
              }),
              Cf = Zr('toLowerCase'),
              Df = qr(function (t, n, r) {
                return t + (r ? '_' : '') + n.toLowerCase();
              }),
              Mf = qr(function (t, n, r) {
                return t + (r ? ' ' : '') + $f(n);
              }),
              Tf = qr(function (t, n, r) {
                return t + (r ? ' ' : '') + n.toUpperCase();
              }),
              $f = Zr('toUpperCase'),
              Ff = fr(function (n, r) {
                try {
                  return t(n, T, r);
                } catch (t) {
                  return pu(t) ? t : new Hu(t);
                }
              }),
              Nf = pe(function (t, n) {
                return (
                  r(n, function (n) {
                    (n = Me(n)), sn(t, n, Ho(t[n], t));
                  }),
                  t
                );
              }),
              Pf = Hr(),
              Zf = Hr(true),
              qf = fr(function (t, n) {
                return function (r) {
                  return Ln(r, t, n);
                };
              }),
              Vf = fr(function (t, n) {
                return function (r) {
                  return Ln(t, r, n);
                };
              }),
              Kf = Xr(c),
              Gf = Xr(u),
              Hf = Xr(h),
              Jf = re(),
              Yf = re(true),
              Qf = Qr(function (t, n) {
                return t + n;
              }, 0),
              Xf = ie('ceil'),
              tc = Qr(function (t, n) {
                return t / n;
              }, 1),
              nc = ie('floor'),
              rc = Qr(function (t, n) {
                return t * n;
              }, 1),
              ec = ie('round'),
              uc = Qr(function (t, n) {
                return t - n;
              }, 0);
            return (
              (mt.after = function (t, n) {
                if (typeof n != 'function') throw new ni('Expected a function');
                return (
                  (t = Eu(t)),
                  function () {
                    if (1 > --t) return n.apply(this, arguments);
                  }
                );
              }),
              (mt.ary = eu),
              (mt.assign = df),
              (mt.assignIn = yf),
              (mt.assignInWith = bf),
              (mt.assignWith = xf),
              (mt.at = jf),
              (mt.before = uu),
              (mt.bind = Ho),
              (mt.bindAll = Nf),
              (mt.bindKey = Jo),
              (mt.castArray = function () {
                if (!arguments.length) return [];
                var t = arguments[0];
                return ff(t) ? t : [t];
              }),
              (mt.chain = Ye),
              (mt.chunk = function (t, n, r) {
                if (((n = (r ? Oe(t, n, r) : n === T) ? 1 : Ui(Eu(n), 0)), (r = null == t ? 0 : t.length), !r || 1 > n)) return [];
                for (var e = 0, u = 0, i = Ku(Oi(r / n)); e < r; ) i[u++] = hr(t, e, (e += n));
                return i;
              }),
              (mt.compact = function (t) {
                for (var n = -1, r = null == t ? 0 : t.length, e = 0, u = []; ++n < r; ) {
                  var i = t[n];
                  i && (u[e++] = i);
                }
                return u;
              }),
              (mt.concat = function () {
                var t = arguments.length;
                if (!t) return [];
                for (var n = Ku(t - 1), r = arguments[0]; t--; ) n[t - 1] = arguments[t];
                return a(ff(r) ? Ur(r) : [r], wn(n, 1));
              }),
              (mt.cond = function (n) {
                var r = null == n ? 0 : n.length,
                  e = ye();
                return (
                  (n = r
                    ? c(n, function (t) {
                        if ('function' != typeof t[1]) throw new ni('Expected a function');
                        return [e(t[0]), t[1]];
                      })
                    : []),
                  fr(function (e) {
                    for (var u = -1; ++u < r; ) {
                      var i = n[u];
                      if (t(i[0], this, e)) return t(i[1], this, e);
                    }
                  })
                );
              }),
              (mt.conforms = function (t) {
                return vn(_n(t, 1));
              }),
              (mt.constant = Tu),
              (mt.countBy = $o),
              (mt.create = function (t, n) {
                var r = eo(t);
                return null == n ? r : an(r, n);
              }),
              (mt.curry = iu),
              (mt.curryRight = ou),
              (mt.debounce = fu),
              (mt.defaults = wf),
              (mt.defaultsDeep = mf),
              (mt.defer = Yo),
              (mt.delay = Qo),
              (mt.difference = wo),
              (mt.differenceBy = mo),
              (mt.differenceWith = Ao),
              (mt.drop = function (t, n, r) {
                var e = null == t ? 0 : t.length;
                return e ? ((n = r || n === T ? 1 : Eu(n)), hr(t, 0 > n ? 0 : n, e)) : [];
              }),
              (mt.dropRight = function (t, n, r) {
                var e = null == t ? 0 : t.length;
                return e ? ((n = r || n === T ? 1 : Eu(n)), (n = e - n), hr(t, 0, 0 > n ? 0 : n)) : [];
              }),
              (mt.dropRightWhile = function (t, n) {
                return t && t.length ? jr(t, ye(n, 3), true, true) : [];
              }),
              (mt.dropWhile = function (t, n) {
                return t && t.length ? jr(t, ye(n, 3), true) : [];
              }),
              (mt.fill = function (t, n, r, e) {
                var u = null == t ? 0 : t.length;
                if (!u) return [];
                for (r && typeof r != 'number' && Oe(t, n, r) && ((r = 0), (e = u)), u = t.length, r = Eu(r), 0 > r && (r = -r > u ? 0 : u + r), e = e === T || e > u ? u : Eu(e), 0 > e && (e += u), e = r > e ? 0 : ku(e); r < e; ) t[r++] = n;
                return t;
              }),
              (mt.filter = function (t, n) {
                return (ff(t) ? i : jn)(t, ye(n, 3));
              }),
              (mt.flatMap = function (t, n) {
                return wn(ru(t, n), 1);
              }),
              (mt.flatMapDeep = function (t, n) {
                return wn(ru(t, n), $);
              }),
              (mt.flatMapDepth = function (t, n, r) {
                return (r = r === T ? 1 : Eu(r)), wn(ru(t, n), r);
              }),
              (mt.flatten = Ze),
              (mt.flattenDeep = function (t) {
                return (null == t ? 0 : t.length) ? wn(t, $) : [];
              }),
              (mt.flattenDepth = function (t, n) {
                return null != t && t.length ? ((n = n === T ? 1 : Eu(n)), wn(t, n)) : [];
              }),
              (mt.flip = function (t) {
                return fe(t, 512);
              }),
              (mt.flow = Pf),
              (mt.flowRight = Zf),
              (mt.fromPairs = function (t) {
                for (var n = -1, r = null == t ? 0 : t.length, e = {}; ++n < r; ) {
                  var u = t[n];
                  e[u[0]] = u[1];
                }
                return e;
              }),
              (mt.functions = function (t) {
                return null == t ? [] : En(t, Wu(t));
              }),
              (mt.functionsIn = function (t) {
                return null == t ? [] : En(t, Bu(t));
              }),
              (mt.groupBy = Po),
              (mt.initial = function (t) {
                return (null == t ? 0 : t.length) ? hr(t, 0, -1) : [];
              }),
              (mt.intersection = Eo),
              (mt.intersectionBy = ko),
              (mt.intersectionWith = So),
              (mt.invert = Af),
              (mt.invertBy = Ef),
              (mt.invokeMap = Zo),
              (mt.iteratee = Fu),
              (mt.keyBy = qo),
              (mt.keys = Wu),
              (mt.keysIn = Bu),
              (mt.map = ru),
              (mt.mapKeys = function (t, n) {
                var r = {};
                return (
                  (n = ye(n, 3)),
                  mn(t, function (t, e, u) {
                    sn(r, n(t, e, u), t);
                  }),
                  r
                );
              }),
              (mt.mapValues = function (t, n) {
                var r = {};
                return (
                  (n = ye(n, 3)),
                  mn(t, function (t, e, u) {
                    sn(r, e, n(t, e, u));
                  }),
                  r
                );
              }),
              (mt.matches = function (t) {
                return Hn(_n(t, 1));
              }),
              (mt.matchesProperty = function (t, n) {
                return Jn(t, _n(n, 1));
              }),
              (mt.memoize = cu),
              (mt.merge = Sf),
              (mt.mergeWith = Of),
              (mt.method = qf),
              (mt.methodOf = Vf),
              (mt.mixin = Nu),
              (mt.negate = au),
              (mt.nthArg = function (t) {
                return (
                  (t = Eu(t)),
                  fr(function (n) {
                    return Qn(n, t);
                  })
                );
              }),
              (mt.omit = If),
              (mt.omitBy = function (t, n) {
                return Lu(t, au(ye(n)));
              }),
              (mt.once = function (t) {
                return uu(2, t);
              }),
              (mt.orderBy = function (t, n, r, e) {
                return null == t ? [] : (ff(n) || (n = null == n ? [] : [n]), (r = e ? T : r), ff(r) || (r = null == r ? [] : [r]), Xn(t, n, r));
              }),
              (mt.over = Kf),
              (mt.overArgs = Xo),
              (mt.overEvery = Gf),
              (mt.overSome = Hf),
              (mt.partial = tf),
              (mt.partialRight = nf),
              (mt.partition = Vo),
              (mt.pick = Rf),
              (mt.pickBy = Lu),
              (mt.property = Zu),
              (mt.propertyOf = function (t) {
                return function (n) {
                  return null == t ? T : kn(t, n);
                };
              }),
              (mt.pull = Oo),
              (mt.pullAll = Ke),
              (mt.pullAllBy = function (t, n, r) {
                return t && t.length && n && n.length ? er(t, n, ye(r, 2)) : t;
              }),
              (mt.pullAllWith = function (t, n, r) {
                return t && t.length && n && n.length ? er(t, n, T, r) : t;
              }),
              (mt.pullAt = Io),
              (mt.range = Jf),
              (mt.rangeRight = Yf),
              (mt.rearg = rf),
              (mt.reject = function (t, n) {
                return (ff(t) ? i : jn)(t, au(ye(n, 3)));
              }),
              (mt.remove = function (t, n) {
                var r = [];
                if (!t || !t.length) return r;
                var e = -1,
                  u = [],
                  i = t.length;
                for (n = ye(n, 3); ++e < i; ) {
                  var o = t[e];
                  n(o, e, t) && (r.push(o), u.push(e));
                }
                return ur(t, u), r;
              }),
              (mt.rest = function (t, n) {
                if (typeof t != 'function') throw new ni('Expected a function');
                return (n = n === T ? n : Eu(n)), fr(t, n);
              }),
              (mt.reverse = Ge),
              (mt.sampleSize = function (t, n, r) {
                return (n = (r ? Oe(t, n, r) : n === T) ? 1 : Eu(n)), (ff(t) ? rn : ar)(t, n);
              }),
              (mt.set = function (t, n, r) {
                return null == t ? t : lr(t, n, r);
              }),
              (mt.setWith = function (t, n, r, e) {
                return (e = typeof e == 'function' ? e : T), null == t ? t : lr(t, n, r, e);
              }),
              (mt.shuffle = function (t) {
                return (ff(t) ? en : sr)(t);
              }),
              (mt.slice = function (t, n, r) {
                var e = null == t ? 0 : t.length;
                return e ? (r && typeof r != 'number' && Oe(t, n, r) ? ((n = 0), (r = e)) : ((n = null == n ? 0 : Eu(n)), (r = r === T ? e : Eu(r))), hr(t, n, r)) : [];
              }),
              (mt.sortBy = Ko),
              (mt.sortedUniq = function (t) {
                return t && t.length ? gr(t) : [];
              }),
              (mt.sortedUniqBy = function (t, n) {
                return t && t.length ? gr(t, ye(n, 2)) : [];
              }),
              (mt.split = function (t, n, r) {
                return r && typeof r != 'number' && Oe(t, n, r) && (n = r = T), (r = r === T ? 4294967295 : r >>> 0), r ? ((t = Iu(t)) && (typeof n == 'string' || (null != n && !hf(n))) && ((n = yr(n)), !n && It.test(t)) ? Or(M(t), 0, r) : t.split(n, r)) : [];
              }),
              (mt.spread = function (n, r) {
                if (typeof n != 'function') throw new ni('Expected a function');
                return (
                  (r = null == r ? 0 : Ui(Eu(r), 0)),
                  fr(function (e) {
                    var u = e[r];
                    return (e = Or(e, 0, r)), u && a(e, u), t(n, this, e);
                  })
                );
              }),
              (mt.tail = function (t) {
                var n = null == t ? 0 : t.length;
                return n ? hr(t, 1, n) : [];
              }),
              (mt.take = function (t, n, r) {
                return t && t.length ? ((n = r || n === T ? 1 : Eu(n)), hr(t, 0, 0 > n ? 0 : n)) : [];
              }),
              (mt.takeRight = function (t, n, r) {
                var e = null == t ? 0 : t.length;
                return e ? ((n = r || n === T ? 1 : Eu(n)), (n = e - n), hr(t, 0 > n ? 0 : n, e)) : [];
              }),
              (mt.takeRightWhile = function (t, n) {
                return t && t.length ? jr(t, ye(n, 3), false, true) : [];
              }),
              (mt.takeWhile = function (t, n) {
                return t && t.length ? jr(t, ye(n, 3)) : [];
              }),
              (mt.tap = function (t, n) {
                return n(t), t;
              }),
              (mt.throttle = function (t, n, r) {
                var e = true,
                  u = true;
                if (typeof t != 'function') throw new ni('Expected a function');
                return du(r) && ((e = 'leading' in r ? !!r.leading : e), (u = 'trailing' in r ? !!r.trailing : u)), fu(t, n, { leading: e, maxWait: n, trailing: u });
              }),
              (mt.thru = Qe),
              (mt.toArray = mu),
              (mt.toPairs = zf),
              (mt.toPairsIn = Wf),
              (mt.toPath = function (t) {
                return ff(t) ? c(t, Me) : wu(t) ? [t] : Ur(jo(Iu(t)));
              }),
              (mt.toPlainObject = Ou),
              (mt.transform = function (t, n, e) {
                var u = ff(t),
                  i = u || af(t) || _f(t);
                if (((n = ye(n, 4)), null == e)) {
                  var o = t && t.constructor;
                  e = i ? (u ? new o() : []) : du(t) && _u(o) ? eo(di(t)) : {};
                }
                return (
                  (i ? r : mn)(t, function (t, r, u) {
                    return n(e, t, r, u);
                  }),
                  e
                );
              }),
              (mt.unary = function (t) {
                return eu(t, 1);
              }),
              (mt.union = Ro),
              (mt.unionBy = zo),
              (mt.unionWith = Wo),
              (mt.uniq = function (t) {
                return t && t.length ? br(t) : [];
              }),
              (mt.uniqBy = function (t, n) {
                return t && t.length ? br(t, ye(n, 2)) : [];
              }),
              (mt.uniqWith = function (t, n) {
                return (n = typeof n == 'function' ? n : T), t && t.length ? br(t, T, n) : [];
              }),
              (mt.unset = function (t, n) {
                return null == t || xr(t, n);
              }),
              (mt.unzip = He),
              (mt.unzipWith = Je),
              (mt.update = function (t, n, r) {
                return null == t ? t : lr(t, n, kr(r)(kn(t, n)), void 0);
              }),
              (mt.updateWith = function (t, n, r, e) {
                return (e = typeof e == 'function' ? e : T), null != t && (t = lr(t, n, kr(r)(kn(t, n)), e)), t;
              }),
              (mt.values = Uu),
              (mt.valuesIn = function (t) {
                return null == t ? [] : S(t, Bu(t));
              }),
              (mt.without = Bo),
              (mt.words = Mu),
              (mt.wrap = function (t, n) {
                return tf(kr(n), t);
              }),
              (mt.xor = Lo),
              (mt.xorBy = Uo),
              (mt.xorWith = Co),
              (mt.zip = Do),
              (mt.zipObject = function (t, n) {
                return Ar(t || [], n || [], on);
              }),
              (mt.zipObjectDeep = function (t, n) {
                return Ar(t || [], n || [], lr);
              }),
              (mt.zipWith = Mo),
              (mt.entries = zf),
              (mt.entriesIn = Wf),
              (mt.extend = yf),
              (mt.extendWith = bf),
              Nu(mt, mt),
              (mt.add = Qf),
              (mt.attempt = Ff),
              (mt.camelCase = Bf),
              (mt.capitalize = Cu),
              (mt.ceil = Xf),
              (mt.clamp = function (t, n, r) {
                return r === T && ((r = n), (n = T)), r !== T && ((r = Su(r)), (r = r === r ? r : 0)), n !== T && ((n = Su(n)), (n = n === n ? n : 0)), pn(Su(t), n, r);
              }),
              (mt.clone = function (t) {
                return _n(t, 4);
              }),
              (mt.cloneDeep = function (t) {
                return _n(t, 5);
              }),
              (mt.cloneDeepWith = function (t, n) {
                return (n = typeof n == 'function' ? n : T), _n(t, 5, n);
              }),
              (mt.cloneWith = function (t, n) {
                return (n = typeof n == 'function' ? n : T), _n(t, 4, n);
              }),
              (mt.conformsTo = function (t, n) {
                return null == n || gn(t, n, Wu(n));
              }),
              (mt.deburr = Du),
              (mt.defaultTo = function (t, n) {
                return null == t || t !== t ? n : t;
              }),
              (mt.divide = tc),
              (mt.endsWith = function (t, n, r) {
                (t = Iu(t)), (n = yr(n));
                var e = t.length,
                  e = (r = r === T ? e : pn(Eu(r), 0, e));
                return (r -= n.length), 0 <= r && t.slice(r, e) == n;
              }),
              (mt.eq = lu),
              (mt.escape = function (t) {
                return (t = Iu(t)) && H.test(t) ? t.replace(K, Xt) : t;
              }),
              (mt.escapeRegExp = function (t) {
                return (t = Iu(t)) && et.test(t) ? t.replace(rt, '\\$&') : t;
              }),
              (mt.every = function (t, n, r) {
                var e = ff(t) ? u : bn;
                return r && Oe(t, n, r) && (n = T), e(t, ye(n, 3));
              }),
              (mt.find = Fo),
              (mt.findIndex = Ne),
              (mt.findKey = function (t, n) {
                return p(t, ye(n, 3), mn);
              }),
              (mt.findLast = No),
              (mt.findLastIndex = Pe),
              (mt.findLastKey = function (t, n) {
                return p(t, ye(n, 3), An);
              }),
              (mt.floor = nc),
              (mt.forEach = tu),
              (mt.forEachRight = nu),
              (mt.forIn = function (t, n) {
                return null == t ? t : oo(t, ye(n, 3), Bu);
              }),
              (mt.forInRight = function (t, n) {
                return null == t ? t : fo(t, ye(n, 3), Bu);
              }),
              (mt.forOwn = function (t, n) {
                return t && mn(t, ye(n, 3));
              }),
              (mt.forOwnRight = function (t, n) {
                return t && An(t, ye(n, 3));
              }),
              (mt.get = Ru),
              (mt.gt = ef),
              (mt.gte = uf),
              (mt.has = function (t, n) {
                return null != t && we(t, n, Rn);
              }),
              (mt.hasIn = zu),
              (mt.head = qe),
              (mt.identity = $u),
              (mt.includes = function (t, n, r, e) {
                return (t = su(t) ? t : Uu(t)), (r = r && !e ? Eu(r) : 0), (e = t.length), 0 > r && (r = Ui(e + r, 0)), ju(t) ? r <= e && -1 < t.indexOf(n, r) : !!e && -1 < v(t, n, r);
              }),
              (mt.indexOf = function (t, n, r) {
                var e = null == t ? 0 : t.length;
                return e ? ((r = null == r ? 0 : Eu(r)), 0 > r && (r = Ui(e + r, 0)), v(t, n, r)) : -1;
              }),
              (mt.inRange = function (t, n, r) {
                return (n = Au(n)), r === T ? ((r = n), (n = 0)) : (r = Au(r)), (t = Su(t)), t >= Ci(n, r) && t < Ui(n, r);
              }),
              (mt.invoke = kf),
              (mt.isArguments = of),
              (mt.isArray = ff),
              (mt.isArrayBuffer = cf),
              (mt.isArrayLike = su),
              (mt.isArrayLikeObject = hu),
              (mt.isBoolean = function (t) {
                return true === t || false === t || (yu(t) && '[object Boolean]' == On(t));
              }),
              (mt.isBuffer = af),
              (mt.isDate = lf),
              (mt.isElement = function (t) {
                return yu(t) && 1 === t.nodeType && !xu(t);
              }),
              (mt.isEmpty = function (t) {
                if (null == t) return true;
                if (su(t) && (ff(t) || typeof t == 'string' || typeof t.splice == 'function' || af(t) || _f(t) || of(t))) return !t.length;
                var n = vo(t);
                if ('[object Map]' == n || '[object Set]' == n) return !t.size;
                if (ze(t)) return !Vn(t).length;
                for (var r in t) if (oi.call(t, r)) return false;
                return true;
              }),
              (mt.isEqual = function (t, n) {
                return Mn(t, n);
              }),
              (mt.isEqualWith = function (t, n, r) {
                var e = (r = typeof r == 'function' ? r : T) ? r(t, n) : T;
                return e === T ? Mn(t, n, T, r) : !!e;
              }),
              (mt.isError = pu),
              (mt.isFinite = function (t) {
                return typeof t == 'number' && Wi(t);
              }),
              (mt.isFunction = _u),
              (mt.isInteger = vu),
              (mt.isLength = gu),
              (mt.isMap = sf),
              (mt.isMatch = function (t, n) {
                return t === n || $n(t, n, xe(n));
              }),
              (mt.isMatchWith = function (t, n, r) {
                return (r = typeof r == 'function' ? r : T), $n(t, n, xe(n), r);
              }),
              (mt.isNaN = function (t) {
                return bu(t) && t != +t;
              }),
              (mt.isNative = function (t) {
                if (go(t)) throw new Hu('Unsupported core-js use. Try https://npms.io/search?q=ponyfill.');
                return Fn(t);
              }),
              (mt.isNil = function (t) {
                return null == t;
              }),
              (mt.isNull = function (t) {
                return null === t;
              }),
              (mt.isNumber = bu),
              (mt.isObject = du),
              (mt.isObjectLike = yu),
              (mt.isPlainObject = xu),
              (mt.isRegExp = hf),
              (mt.isSafeInteger = function (t) {
                return vu(t) && -9007199254740991 <= t && 9007199254740991 >= t;
              }),
              (mt.isSet = pf),
              (mt.isString = ju),
              (mt.isSymbol = wu),
              (mt.isTypedArray = _f),
              (mt.isUndefined = function (t) {
                return t === T;
              }),
              (mt.isWeakMap = function (t) {
                return yu(t) && '[object WeakMap]' == vo(t);
              }),
              (mt.isWeakSet = function (t) {
                return yu(t) && '[object WeakSet]' == On(t);
              }),
              (mt.join = function (t, n) {
                return null == t ? '' : Bi.call(t, n);
              }),
              (mt.kebabCase = Lf),
              (mt.last = Ve),
              (mt.lastIndexOf = function (t, n, r) {
                var e = null == t ? 0 : t.length;
                if (!e) return -1;
                var u = e;
                if ((r !== T && ((u = Eu(r)), (u = 0 > u ? Ui(e + u, 0) : Ci(u, e - 1))), n === n)) {
                  for (r = u + 1; r-- && t[r] !== n; );
                  t = r;
                } else t = _(t, d, u, true);
                return t;
              }),
              (mt.lowerCase = Uf),
              (mt.lowerFirst = Cf),
              (mt.lt = vf),
              (mt.lte = gf),
              (mt.max = function (t) {
                return t && t.length ? xn(t, $u, In) : T;
              }),
              (mt.maxBy = function (t, n) {
                return t && t.length ? xn(t, ye(n, 2), In) : T;
              }),
              (mt.mean = function (t) {
                return y(t, $u);
              }),
              (mt.meanBy = function (t, n) {
                return y(t, ye(n, 2));
              }),
              (mt.min = function (t) {
                return t && t.length ? xn(t, $u, Kn) : T;
              }),
              (mt.minBy = function (t, n) {
                return t && t.length ? xn(t, ye(n, 2), Kn) : T;
              }),
              (mt.stubArray = qu),
              (mt.stubFalse = Vu),
              (mt.stubObject = function () {
                return {};
              }),
              (mt.stubString = function () {
                return '';
              }),
              (mt.stubTrue = function () {
                return true;
              }),
              (mt.multiply = rc),
              (mt.nth = function (t, n) {
                return t && t.length ? Qn(t, Eu(n)) : T;
              }),
              (mt.noConflict = function () {
                return Tt._ === this && (Tt._ = si), this;
              }),
              (mt.noop = Pu),
              (mt.now = Go),
              (mt.pad = function (t, n, r) {
                t = Iu(t);
                var e = (n = Eu(n)) ? D(t) : 0;
                return !n || e >= n ? t : ((n = (n - e) / 2), te(Ii(n), r) + t + te(Oi(n), r));
              }),
              (mt.padEnd = function (t, n, r) {
                t = Iu(t);
                var e = (n = Eu(n)) ? D(t) : 0;
                return n && e < n ? t + te(n - e, r) : t;
              }),
              (mt.padStart = function (t, n, r) {
                t = Iu(t);
                var e = (n = Eu(n)) ? D(t) : 0;
                return n && e < n ? te(n - e, r) + t : t;
              }),
              (mt.parseInt = function (t, n, r) {
                return r || null == n ? (n = 0) : n && (n = +n), Mi(Iu(t).replace(it, ''), n || 0);
              }),
              (mt.random = function (t, n, r) {
                if ((r && typeof r != 'boolean' && Oe(t, n, r) && (n = r = T), r === T && (typeof n == 'boolean' ? ((r = n), (n = T)) : typeof t == 'boolean' && ((r = t), (t = T))), t === T && n === T ? ((t = 0), (n = 1)) : ((t = Au(t)), n === T ? ((n = t), (t = 0)) : (n = Au(n))), t > n)) {
                  var e = t;
                  (t = n), (n = e);
                }
                return r || t % 1 || n % 1 ? ((r = Ti()), Ci(t + r * (n - t + Ut('1e-' + ((r + '').length - 1))), n)) : ir(t, n);
              }),
              (mt.reduce = function (t, n, r) {
                var e = ff(t) ? l : j,
                  u = 3 > arguments.length;
                return e(t, ye(n, 4), r, u, uo);
              }),
              (mt.reduceRight = function (t, n, r) {
                var e = ff(t) ? s : j,
                  u = 3 > arguments.length;
                return e(t, ye(n, 4), r, u, io);
              }),
              (mt.repeat = function (t, n, r) {
                return (n = (r ? Oe(t, n, r) : n === T) ? 1 : Eu(n)), or(Iu(t), n);
              }),
              (mt.replace = function () {
                var t = arguments,
                  n = Iu(t[0]);
                return 3 > t.length ? n : n.replace(t[1], t[2]);
              }),
              (mt.result = function (t, n, r) {
                n = Sr(n, t);
                var e = -1,
                  u = n.length;
                for (u || ((u = 1), (t = T)); ++e < u; ) {
                  var i = null == t ? T : t[Me(n[e])];
                  i === T && ((e = u), (i = r)), (t = _u(i) ? i.call(t) : i);
                }
                return t;
              }),
              (mt.round = ec),
              (mt.runInContext = x),
              (mt.sample = function (t) {
                return (ff(t) ? Yt : cr)(t);
              }),
              (mt.size = function (t) {
                if (null == t) return 0;
                if (su(t)) return ju(t) ? D(t) : t.length;
                var n = vo(t);
                return '[object Map]' == n || '[object Set]' == n ? t.size : Vn(t).length;
              }),
              (mt.snakeCase = Df),
              (mt.some = function (t, n, r) {
                var e = ff(t) ? h : pr;
                return r && Oe(t, n, r) && (n = T), e(t, ye(n, 3));
              }),
              (mt.sortedIndex = function (t, n) {
                return _r(t, n);
              }),
              (mt.sortedIndexBy = function (t, n, r) {
                return vr(t, n, ye(r, 2));
              }),
              (mt.sortedIndexOf = function (t, n) {
                var r = null == t ? 0 : t.length;
                if (r) {
                  var e = _r(t, n);
                  if (e < r && lu(t[e], n)) return e;
                }
                return -1;
              }),
              (mt.sortedLastIndex = function (t, n) {
                return _r(t, n, true);
              }),
              (mt.sortedLastIndexBy = function (t, n, r) {
                return vr(t, n, ye(r, 2), true);
              }),
              (mt.sortedLastIndexOf = function (t, n) {
                if (null == t ? 0 : t.length) {
                  var r = _r(t, n, true) - 1;
                  if (lu(t[r], n)) return r;
                }
                return -1;
              }),
              (mt.startCase = Mf),
              (mt.startsWith = function (t, n, r) {
                return (t = Iu(t)), (r = null == r ? 0 : pn(Eu(r), 0, t.length)), (n = yr(n)), t.slice(r, r + n.length) == n;
              }),
              (mt.subtract = uc),
              (mt.sum = function (t) {
                return t && t.length ? m(t, $u) : 0;
              }),
              (mt.sumBy = function (t, n) {
                return t && t.length ? m(t, ye(n, 2)) : 0;
              }),
              (mt.template = function (t, n, r) {
                var e = mt.templateSettings;
                r && Oe(t, n, r) && (n = T), (t = Iu(t)), (n = bf({}, n, e, ce)), (r = bf({}, n.imports, e.imports, ce));
                var u,
                  i,
                  o = Wu(r),
                  f = S(r, o),
                  c = 0;
                r = n.interpolate || xt;
                var a = "__p+='";
                r = Xu((n.escape || xt).source + '|' + r.source + '|' + (r === Q ? ht : xt).source + '|' + (n.evaluate || xt).source + '|$', 'g');
                var l = oi.call(n, 'sourceURL') ? '//# sourceURL=' + (n.sourceURL + '').replace(/[\r\n]/g, ' ') + '\n' : '';
                if (
                  (t.replace(r, function (n, r, e, o, f, l) {
                    return e || (e = o), (a += t.slice(c, l).replace(jt, z)), r && ((u = true), (a += "'+__e(" + r + ")+'")), f && ((i = true), (a += "';" + f + ";\n__p+='")), e && (a += "'+((__t=(" + e + "))==null?'':__t)+'"), (c = l + n.length), n;
                  }),
                  (a += "';"),
                  (n = oi.call(n, 'variable') && n.variable) || (a = 'with(obj){' + a + '}'),
                  (a = (i ? a.replace(P, '') : a).replace(Z, '$1').replace(q, '$1;')),
                  (a = 'function(' + (n || 'obj') + '){' + (n ? '' : 'obj||(obj={});') + "var __t,__p=''" + (u ? ',__e=_.escape' : '') + (i ? ",__j=Array.prototype.join;function print(){__p+=__j.call(arguments,'')}" : ';') + a + 'return __p}'),
                  (n = Ff(function () {
                    return Ju(o, l + 'return ' + a).apply(T, f);
                  })),
                  (n.source = a),
                  pu(n))
                )
                  throw n;
                return n;
              }),
              (mt.times = function (t, n) {
                if (((t = Eu(t)), 1 > t || 9007199254740991 < t)) return [];
                var r = 4294967295,
                  e = Ci(t, 4294967295);
                for (n = ye(n), t -= 4294967295, e = A(e, n); ++r < t; ) n(r);
                return e;
              }),
              (mt.toFinite = Au),
              (mt.toInteger = Eu),
              (mt.toLength = ku),
              (mt.toLower = function (t) {
                return Iu(t).toLowerCase();
              }),
              (mt.toNumber = Su),
              (mt.toSafeInteger = function (t) {
                return t ? pn(Eu(t), -9007199254740991, 9007199254740991) : 0 === t ? t : 0;
              }),
              (mt.toString = Iu),
              (mt.toUpper = function (t) {
                return Iu(t).toUpperCase();
              }),
              (mt.trim = function (t, n, r) {
                return (t = Iu(t)) && (r || n === T) ? t.replace(ut, '') : t && (n = yr(n)) ? ((t = M(t)), (r = M(n)), (n = I(t, r)), (r = R(t, r) + 1), Or(t, n, r).join('')) : t;
              }),
              (mt.trimEnd = function (t, n, r) {
                return (t = Iu(t)) && (r || n === T) ? t.replace(ot, '') : t && (n = yr(n)) ? ((t = M(t)), (n = R(t, M(n)) + 1), Or(t, 0, n).join('')) : t;
              }),
              (mt.trimStart = function (t, n, r) {
                return (t = Iu(t)) && (r || n === T) ? t.replace(it, '') : t && (n = yr(n)) ? ((t = M(t)), (n = I(t, M(n))), Or(t, n).join('')) : t;
              }),
              (mt.truncate = function (t, n) {
                var r = 30,
                  e = '...';
                if (du(n))
                  var u = 'separator' in n ? n.separator : u,
                    r = 'length' in n ? Eu(n.length) : r,
                    e = 'omission' in n ? yr(n.omission) : e;
                t = Iu(t);
                var i = t.length;
                if (It.test(t))
                  var o = M(t),
                    i = o.length;
                if (r >= i) return t;
                if (((i = r - D(e)), 1 > i)) return e;
                if (((r = o ? Or(o, 0, i).join('') : t.slice(0, i)), u === T)) return r + e;
                if ((o && (i += r.length - i), hf(u))) {
                  if (t.slice(i).search(u)) {
                    var f = r;
                    for (u.global || (u = Xu(u.source, Iu(pt.exec(u)) + 'g')), u.lastIndex = 0; (o = u.exec(f)); ) var c = o.index;
                    r = r.slice(0, c === T ? i : c);
                  }
                } else t.indexOf(yr(u), i) != i && ((u = r.lastIndexOf(u)), -1 < u && (r = r.slice(0, u)));
                return r + e;
              }),
              (mt.unescape = function (t) {
                return (t = Iu(t)) && G.test(t) ? t.replace(V, tn) : t;
              }),
              (mt.uniqueId = function (t) {
                var n = ++fi;
                return Iu(t) + n;
              }),
              (mt.upperCase = Tf),
              (mt.upperFirst = $f),
              (mt.each = tu),
              (mt.eachRight = nu),
              (mt.first = qe),
              Nu(
                mt,
                (function () {
                  var t = {};
                  return (
                    mn(mt, function (n, r) {
                      oi.call(mt.prototype, r) || (t[r] = n);
                    }),
                    t
                  );
                })(),
                { chain: false }
              ),
              (mt.VERSION = '4.17.15'),
              r('bind bindKey curry curryRight partial partialRight'.split(' '), function (t) {
                mt[t].placeholder = mt;
              }),
              r(['drop', 'take'], function (t, n) {
                (Lt.prototype[t] = function (r) {
                  r = r === T ? 1 : Ui(Eu(r), 0);
                  var e = this.__filtered__ && !n ? new Lt(this) : this.clone();
                  return e.__filtered__ ? (e.__takeCount__ = Ci(r, e.__takeCount__)) : e.__views__.push({ size: Ci(r, 4294967295), type: t + (0 > e.__dir__ ? 'Right' : '') }), e;
                }),
                  (Lt.prototype[t + 'Right'] = function (n) {
                    return this.reverse()[t](n).reverse();
                  });
              }),
              r(['filter', 'map', 'takeWhile'], function (t, n) {
                var r = n + 1,
                  e = 1 == r || 3 == r;
                Lt.prototype[t] = function (t) {
                  var n = this.clone();
                  return n.__iteratees__.push({ iteratee: ye(t, 3), type: r }), (n.__filtered__ = n.__filtered__ || e), n;
                };
              }),
              r(['head', 'last'], function (t, n) {
                var r = 'take' + (n ? 'Right' : '');
                Lt.prototype[t] = function () {
                  return this[r](1).value()[0];
                };
              }),
              r(['initial', 'tail'], function (t, n) {
                var r = 'drop' + (n ? '' : 'Right');
                Lt.prototype[t] = function () {
                  return this.__filtered__ ? new Lt(this) : this[r](1);
                };
              }),
              (Lt.prototype.compact = function () {
                return this.filter($u);
              }),
              (Lt.prototype.find = function (t) {
                return this.filter(t).head();
              }),
              (Lt.prototype.findLast = function (t) {
                return this.reverse().find(t);
              }),
              (Lt.prototype.invokeMap = fr(function (t, n) {
                return typeof t == 'function'
                  ? new Lt(this)
                  : this.map(function (r) {
                      return Ln(r, t, n);
                    });
              })),
              (Lt.prototype.reject = function (t) {
                return this.filter(au(ye(t)));
              }),
              (Lt.prototype.slice = function (t, n) {
                t = Eu(t);
                var r = this;
                return r.__filtered__ && (0 < t || 0 > n) ? new Lt(r) : (0 > t ? (r = r.takeRight(-t)) : t && (r = r.drop(t)), n !== T && ((n = Eu(n)), (r = 0 > n ? r.dropRight(-n) : r.take(n - t))), r);
              }),
              (Lt.prototype.takeRightWhile = function (t) {
                return this.reverse().takeWhile(t).reverse();
              }),
              (Lt.prototype.toArray = function () {
                return this.take(4294967295);
              }),
              mn(Lt.prototype, function (t, n) {
                var r = /^(?:filter|find|map|reject)|While$/.test(n),
                  e = /^(?:head|last)$/.test(n),
                  u = mt[e ? 'take' + ('last' == n ? 'Right' : '') : n],
                  i = e || /^find/.test(n);
                u &&
                  (mt.prototype[n] = function () {
                    function n(t) {
                      return (t = u.apply(mt, a([t], f))), e && h ? t[0] : t;
                    }
                    var o = this.__wrapped__,
                      f = e ? [1] : arguments,
                      c = o instanceof Lt,
                      l = f[0],
                      s = c || ff(o);
                    s && r && typeof l == 'function' && 1 != l.length && (c = s = false);
                    var h = this.__chain__,
                      p = !!this.__actions__.length,
                      l = i && !h,
                      c = c && !p;
                    return !i && s ? ((o = c ? o : new Lt(this)), (o = t.apply(o, f)), o.__actions__.push({ func: Qe, args: [n], thisArg: T }), new St(o, h)) : l && c ? t.apply(this, f) : ((o = this.thru(n)), l ? (e ? o.value()[0] : o.value()) : o);
                  });
              }),
              r('pop push shift sort splice unshift'.split(' '), function (t) {
                var n = ri[t],
                  r = /^(?:push|sort|unshift)$/.test(t) ? 'tap' : 'thru',
                  e = /^(?:pop|shift)$/.test(t);
                mt.prototype[t] = function () {
                  var t = arguments;
                  if (e && !this.__chain__) {
                    var u = this.value();
                    return n.apply(ff(u) ? u : [], t);
                  }
                  return this[r](function (r) {
                    return n.apply(ff(r) ? r : [], t);
                  });
                };
              }),
              mn(Lt.prototype, function (t, n) {
                var r = mt[n];
                if (r) {
                  var e = r.name + '';
                  oi.call(Gi, e) || (Gi[e] = []), Gi[e].push({ name: n, func: r });
                }
              }),
              (Gi[Jr(T, 2).name] = [{ name: 'wrapper', func: T }]),
              (Lt.prototype.clone = function () {
                var t = new Lt(this.__wrapped__);
                return (t.__actions__ = Ur(this.__actions__)), (t.__dir__ = this.__dir__), (t.__filtered__ = this.__filtered__), (t.__iteratees__ = Ur(this.__iteratees__)), (t.__takeCount__ = this.__takeCount__), (t.__views__ = Ur(this.__views__)), t;
              }),
              (Lt.prototype.reverse = function () {
                if (this.__filtered__) {
                  var t = new Lt(this);
                  (t.__dir__ = -1), (t.__filtered__ = true);
                } else (t = this.clone()), (t.__dir__ *= -1);
                return t;
              }),
              (Lt.prototype.value = function () {
                var t,
                  n = this.__wrapped__.value(),
                  r = this.__dir__,
                  e = ff(n),
                  u = 0 > r,
                  i = e ? n.length : 0;
                t = i;
                for (var o = this.__views__, f = 0, c = -1, a = o.length; ++c < a; ) {
                  var l = o[c],
                    s = l.size;
                  switch (l.type) {
                    case 'drop':
                      f += s;
                      break;
                    case 'dropRight':
                      t -= s;
                      break;
                    case 'take':
                      t = Ci(t, f + s);
                      break;
                    case 'takeRight':
                      f = Ui(f, t - s);
                  }
                }
                if (((t = { start: f, end: t }), (o = t.start), (f = t.end), (t = f - o), (o = u ? f : o - 1), (f = this.__iteratees__), (c = f.length), (a = 0), (l = Ci(t, this.__takeCount__)), !e || (!u && i == t && l == t))) return wr(n, this.__actions__);
                e = [];
                t: for (; t-- && a < l; ) {
                  for (o += r, u = -1, i = n[o]; ++u < c; ) {
                    var h = f[u],
                      s = h.type,
                      h = (0, h.iteratee)(i);
                    if (2 == s) i = h;
                    else if (!h) {
                      if (1 == s) continue t;
                      break t;
                    }
                  }
                  e[a++] = i;
                }
                return e;
              }),
              (mt.prototype.at = To),
              (mt.prototype.chain = function () {
                return Ye(this);
              }),
              (mt.prototype.commit = function () {
                return new St(this.value(), this.__chain__);
              }),
              (mt.prototype.next = function () {
                this.__values__ === T && (this.__values__ = mu(this.value()));
                var t = this.__index__ >= this.__values__.length;
                return { done: t, value: t ? T : this.__values__[this.__index__++] };
              }),
              (mt.prototype.plant = function (t) {
                for (var n, r = this; r instanceof At; ) {
                  var e = Fe(r);
                  (e.__index__ = 0), (e.__values__ = T), n ? (u.__wrapped__ = e) : (n = e);
                  var u = e,
                    r = r.__wrapped__;
                }
                return (u.__wrapped__ = t), n;
              }),
              (mt.prototype.reverse = function () {
                var t = this.__wrapped__;
                return t instanceof Lt ? (this.__actions__.length && (t = new Lt(this)), (t = t.reverse()), t.__actions__.push({ func: Qe, args: [Ge], thisArg: T }), new St(t, this.__chain__)) : this.thru(Ge);
              }),
              (mt.prototype.toJSON =
                mt.prototype.valueOf =
                mt.prototype.value =
                  function () {
                    return wr(this.__wrapped__, this.__actions__);
                  }),
              (mt.prototype.first = mt.prototype.head),
              wi && (mt.prototype[wi] = Xe),
              mt
            );
          })();
        typeof define == 'function' && typeof define.amd == 'object' && define.amd
          ? ((Tt._ = nn),
            define(function () {
              return nn;
            }))
          : Ft
          ? (((Ft.exports = nn)._ = nn), ($t._ = nn))
          : (Tt._ = nn);
      }.call(this));
    },
    'sap/ui/yesco/libs/moment.js': function () {
      !(function (e, a) {
        'object' == typeof exports && 'undefined' != typeof module ? (module.exports = a()) : 'function' == typeof define && define.amd ? define(a) : (e.moment = a());
      })(this, function () {
        'use strict';
        var e, a;
        function t() {
          return e.apply(null, arguments);
        }
        function s(e) {
          return e instanceof Array || '[object Array]' === Object.prototype.toString.call(e);
        }
        function n(e) {
          return null != e && '[object Object]' === Object.prototype.toString.call(e);
        }
        function d(e, a) {
          return Object.prototype.hasOwnProperty.call(e, a);
        }
        function r(e) {
          if (Object.getOwnPropertyNames) return 0 === Object.getOwnPropertyNames(e).length;
          for (var a in e) if (d(e, a)) return;
          return 1;
        }
        function i(e) {
          return void 0 === e;
        }
        function u(e) {
          return 'number' == typeof e || '[object Number]' === Object.prototype.toString.call(e);
        }
        function _(e) {
          return e instanceof Date || '[object Date]' === Object.prototype.toString.call(e);
        }
        function o(e, a) {
          for (var t = [], s = 0; s < e.length; ++s) t.push(a(e[s], s));
          return t;
        }
        function m(e, a) {
          for (var t in a) d(a, t) && (e[t] = a[t]);
          return d(a, 'toString') && (e.toString = a.toString), d(a, 'valueOf') && (e.valueOf = a.valueOf), e;
        }
        function l(e, a, t, s) {
          return Sa(e, a, t, s, !0).utc();
        }
        function M(e) {
          return (
            null == e._pf &&
              (e._pf = { empty: !1, unusedTokens: [], unusedInput: [], overflow: -2, charsLeftOver: 0, nullInput: !1, invalidEra: null, invalidMonth: null, invalidFormat: !1, userInvalidated: !1, iso: !1, parsedDateParts: [], era: null, meridiem: null, rfc2822: !1, weekdayMismatch: !1 }),
            e._pf
          );
        }
        function h(e) {
          if (null == e._isValid) {
            var t = M(e),
              s = a.call(t.parsedDateParts, function (e) {
                return null != e;
              }),
              n = !isNaN(e._d.getTime()) && t.overflow < 0 && !t.empty && !t.invalidEra && !t.invalidMonth && !t.invalidWeekday && !t.weekdayMismatch && !t.nullInput && !t.invalidFormat && !t.userInvalidated && (!t.meridiem || (t.meridiem && s));
            if ((e._strict && (n = n && 0 === t.charsLeftOver && 0 === t.unusedTokens.length && void 0 === t.bigHour), null != Object.isFrozen && Object.isFrozen(e))) return n;
            e._isValid = n;
          }
          return e._isValid;
        }
        function c(e) {
          var a = l(NaN);
          return null != e ? m(M(a), e) : (M(a).userInvalidated = !0), a;
        }
        a = Array.prototype.some
          ? Array.prototype.some
          : function (e) {
              for (var a = Object(this), t = a.length >>> 0, s = 0; s < t; s++) if (s in a && e.call(this, a[s], s, a)) return !0;
              return !1;
            };
        var L = (t.momentProperties = []),
          Y = !1;
        function y(e, a) {
          var t, s, n;
          if (
            (i(a._isAMomentObject) || (e._isAMomentObject = a._isAMomentObject),
            i(a._i) || (e._i = a._i),
            i(a._f) || (e._f = a._f),
            i(a._l) || (e._l = a._l),
            i(a._strict) || (e._strict = a._strict),
            i(a._tzm) || (e._tzm = a._tzm),
            i(a._isUTC) || (e._isUTC = a._isUTC),
            i(a._offset) || (e._offset = a._offset),
            i(a._pf) || (e._pf = M(a)),
            i(a._locale) || (e._locale = a._locale),
            0 < L.length)
          )
            for (t = 0; t < L.length; t++) i((n = a[(s = L[t])])) || (e[s] = n);
          return e;
        }
        function f(e) {
          y(this, e), (this._d = new Date(null != e._d ? e._d.getTime() : NaN)), this.isValid() || (this._d = new Date(NaN)), !1 === Y && ((Y = !0), t.updateOffset(this), (Y = !1));
        }
        function p(e) {
          return e instanceof f || (null != e && null != e._isAMomentObject);
        }
        function k(e) {
          !1 === t.suppressDeprecationWarnings && 'undefined' != typeof console && console.warn && console.warn('Deprecation warning: ' + e);
        }
        function D(e, a) {
          var s = !0;
          return m(function () {
            if ((null != t.deprecationHandler && t.deprecationHandler(null, e), s)) {
              for (var n, r, i = [], u = 0; u < arguments.length; u++) {
                if (((n = ''), 'object' == typeof arguments[u])) {
                  for (r in ((n += '\n[' + u + '] '), arguments[0])) d(arguments[0], r) && (n += r + ': ' + arguments[0][r] + ', ');
                  n = n.slice(0, -2);
                } else n = arguments[u];
                i.push(n);
              }
              k(e + '\nArguments: ' + Array.prototype.slice.call(i).join('') + '\n' + new Error().stack), (s = !1);
            }
            return a.apply(this, arguments);
          }, a);
        }
        var T,
          g = {};
        function w(e, a) {
          null != t.deprecationHandler && t.deprecationHandler(e, a), g[e] || (k(a), (g[e] = !0));
        }
        function b(e) {
          return ('undefined' != typeof Function && e instanceof Function) || '[object Function]' === Object.prototype.toString.call(e);
        }
        function v(e, a) {
          var t,
            s = m({}, e);
          for (t in a) d(a, t) && (n(e[t]) && n(a[t]) ? ((s[t] = {}), m(s[t], e[t]), m(s[t], a[t])) : null != a[t] ? (s[t] = a[t]) : delete s[t]);
          for (t in e) d(e, t) && !d(a, t) && n(e[t]) && (s[t] = m({}, s[t]));
          return s;
        }
        function S(e) {
          null != e && this.set(e);
        }
        (t.suppressDeprecationWarnings = !1),
          (t.deprecationHandler = null),
          (T = Object.keys
            ? Object.keys
            : function (e) {
                var a,
                  t = [];
                for (a in e) d(e, a) && t.push(a);
                return t;
              });
        function H(e, a, t) {
          var s = '' + Math.abs(e),
            n = a - s.length;
          return (0 <= e ? (t ? '+' : '') : '-') + Math.pow(10, Math.max(0, n)).toString().substr(1) + s;
        }
        var j = /(\[[^\[]*\])|(\\)?([Hh]mm(ss)?|Mo|MM?M?M?|Do|DDDo|DD?D?D?|ddd?d?|do?|w[o|w]?|W[o|W]?|Qo?|N{1,5}|YYYYYY|YYYYY|YYYY|YY|y{2,4}|yo?|gg(ggg?)?|GG(GGG?)?|e|E|a|A|hh?|HH?|kk?|mm?|ss?|S{1,9}|x|X|zz?|ZZ?|.)/g,
          x = /(\[[^\[]*\])|(\\)?(LTS|LT|LL?L?L?|l{1,4})/g,
          P = {},
          O = {};
        function W(e, a, t, s) {
          var n =
            'string' == typeof s
              ? function () {
                  return this[s]();
                }
              : s;
          e && (O[e] = n),
            a &&
              (O[a[0]] = function () {
                return H(n.apply(this, arguments), a[1], a[2]);
              }),
            t &&
              (O[t] = function () {
                return this.localeData().ordinal(n.apply(this, arguments), e);
              });
        }
        function A(e, a) {
          return e.isValid()
            ? ((a = E(a, e.localeData())),
              (P[a] =
                P[a] ||
                (function (e) {
                  for (var a, t = e.match(j), s = 0, n = t.length; s < n; s++) O[t[s]] ? (t[s] = O[t[s]]) : (t[s] = (a = t[s]).match(/\[[\s\S]/) ? a.replace(/^\[|\]$/g, '') : a.replace(/\\/g, ''));
                  return function (a) {
                    for (var s = '', d = 0; d < n; d++) s += b(t[d]) ? t[d].call(a, e) : t[d];
                    return s;
                  };
                })(a)),
              P[a](e))
            : e.localeData().invalidDate();
        }
        function E(e, a) {
          var t = 5;
          function s(e) {
            return a.longDateFormat(e) || e;
          }
          for (x.lastIndex = 0; 0 <= t && x.test(e); ) (e = e.replace(x, s)), (x.lastIndex = 0), --t;
          return e;
        }
        var F = {};
        function z(e, a) {
          var t = e.toLowerCase();
          F[t] = F[t + 's'] = F[a] = e;
        }
        function N(e) {
          return 'string' == typeof e ? F[e] || F[e.toLowerCase()] : void 0;
        }
        function J(e) {
          var a,
            t,
            s = {};
          for (t in e) d(e, t) && (a = N(t)) && (s[a] = e[t]);
          return s;
        }
        var R = {};
        function C(e, a) {
          R[e] = a;
        }
        function I(e) {
          return (e % 4 == 0 && e % 100 != 0) || e % 400 == 0;
        }
        function U(e) {
          return e < 0 ? Math.ceil(e) || 0 : Math.floor(e);
        }
        function G(e) {
          var a = +e,
            t = 0;
          return 0 != a && isFinite(a) && (t = U(a)), t;
        }
        function V(e, a) {
          return function (s) {
            return null != s ? (K(this, e, s), t.updateOffset(this, a), this) : B(this, e);
          };
        }
        function B(e, a) {
          return e.isValid() ? e._d['get' + (e._isUTC ? 'UTC' : '') + a]() : NaN;
        }
        function K(e, a, t) {
          e.isValid() && !isNaN(t) && ('FullYear' === a && I(e.year()) && 1 === e.month() && 29 === e.date() ? ((t = G(t)), e._d['set' + (e._isUTC ? 'UTC' : '') + a](t, e.month(), Se(t, e.month()))) : e._d['set' + (e._isUTC ? 'UTC' : '') + a](t));
        }
        var q,
          Z = /\d/,
          $ = /\d\d/,
          Q = /\d{3}/,
          X = /\d{4}/,
          ee = /[+-]?\d{6}/,
          ae = /\d\d?/,
          te = /\d\d\d\d?/,
          se = /\d\d\d\d\d\d?/,
          ne = /\d{1,3}/,
          de = /\d{1,4}/,
          re = /[+-]?\d{1,6}/,
          ie = /\d+/,
          ue = /[+-]?\d+/,
          _e = /Z|[+-]\d\d:?\d\d/gi,
          oe = /Z|[+-]\d\d(?::?\d\d)?/gi,
          me = /[0-9]{0,256}['a-z\u00A0-\u05FF\u0700-\uD7FF\uF900-\uFDCF\uFDF0-\uFF07\uFF10-\uFFEF]{1,256}|[\u0600-\u06FF\/]{1,256}(\s*?[\u0600-\u06FF]{1,256}){1,2}/i;
        function le(e, a, t) {
          q[e] = b(a)
            ? a
            : function (e, s) {
                return e && t ? t : a;
              };
        }
        function Me(e, a) {
          return d(q, e)
            ? q[e](a._strict, a._locale)
            : new RegExp(
                he(
                  e.replace('\\', '').replace(/\\(\[)|\\(\])|\[([^\]\[]*)\]|\\(.)/g, function (e, a, t, s, n) {
                    return a || t || s || n;
                  })
                )
              );
        }
        function he(e) {
          return e.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        }
        q = {};
        var ce = {};
        function Le(e, a) {
          var t,
            s = a;
          for (
            'string' == typeof e && (e = [e]),
              u(a) &&
                (s = function (e, t) {
                  t[a] = G(e);
                }),
              t = 0;
            t < e.length;
            t++
          )
            ce[e[t]] = s;
        }
        function Ye(e, a) {
          Le(e, function (e, t, s, n) {
            (s._w = s._w || {}), a(e, s._w, s, n);
          });
        }
        var ye,
          fe = 0,
          pe = 1,
          ke = 2,
          De = 3,
          Te = 4,
          ge = 5,
          we = 6,
          be = 7,
          ve = 8;
        function Se(e, a) {
          if (isNaN(e) || isNaN(a)) return NaN;
          var t,
            s = ((a % (t = 12)) + t) % t;
          return (e += (a - s) / 12), 1 == s ? (I(e) ? 29 : 28) : 31 - ((s % 7) % 2);
        }
        (ye = Array.prototype.indexOf
          ? Array.prototype.indexOf
          : function (e) {
              for (var a = 0; a < this.length; ++a) if (this[a] === e) return a;
              return -1;
            }),
          W('M', ['MM', 2], 'Mo', function () {
            return this.month() + 1;
          }),
          W('MMM', 0, 0, function (e) {
            return this.localeData().monthsShort(this, e);
          }),
          W('MMMM', 0, 0, function (e) {
            return this.localeData().months(this, e);
          }),
          z('month', 'M'),
          C('month', 8),
          le('M', ae),
          le('MM', ae, $),
          le('MMM', function (e, a) {
            return a.monthsShortRegex(e);
          }),
          le('MMMM', function (e, a) {
            return a.monthsRegex(e);
          }),
          Le(['M', 'MM'], function (e, a) {
            a[pe] = G(e) - 1;
          }),
          Le(['MMM', 'MMMM'], function (e, a, t, s) {
            var n = t._locale.monthsParse(e, s, t._strict);
            null != n ? (a[pe] = n) : (M(t).invalidMonth = e);
          });
        var He = 'January_February_March_April_May_June_July_August_September_October_November_December'.split('_'),
          je = 'Jan_Feb_Mar_Apr_May_Jun_Jul_Aug_Sep_Oct_Nov_Dec'.split('_'),
          xe = /D[oD]?(\[[^\[\]]*\]|\s)+MMMM?/,
          Pe = me,
          Oe = me;
        function We(e, a) {
          var t;
          if (!e.isValid()) return e;
          if ('string' == typeof a)
            if (/^\d+$/.test(a)) a = G(a);
            else if (!u((a = e.localeData().monthsParse(a)))) return e;
          return (t = Math.min(e.date(), Se(e.year(), a))), e._d['set' + (e._isUTC ? 'UTC' : '') + 'Month'](a, t), e;
        }
        function Ae(e) {
          return null != e ? (We(this, e), t.updateOffset(this, !0), this) : B(this, 'Month');
        }
        function Ee() {
          function e(e, a) {
            return a.length - e.length;
          }
          for (var a, t = [], s = [], n = [], d = 0; d < 12; d++) (a = l([2e3, d])), t.push(this.monthsShort(a, '')), s.push(this.months(a, '')), n.push(this.months(a, '')), n.push(this.monthsShort(a, ''));
          for (t.sort(e), s.sort(e), n.sort(e), d = 0; d < 12; d++) (t[d] = he(t[d])), (s[d] = he(s[d]));
          for (d = 0; d < 24; d++) n[d] = he(n[d]);
          (this._monthsRegex = new RegExp('^(' + n.join('|') + ')', 'i')), (this._monthsShortRegex = this._monthsRegex), (this._monthsStrictRegex = new RegExp('^(' + s.join('|') + ')', 'i')), (this._monthsShortStrictRegex = new RegExp('^(' + t.join('|') + ')', 'i'));
        }
        function Fe(e) {
          return I(e) ? 366 : 365;
        }
        W('Y', 0, 0, function () {
          var e = this.year();
          return e <= 9999 ? H(e, 4) : '+' + e;
        }),
          W(0, ['YY', 2], 0, function () {
            return this.year() % 100;
          }),
          W(0, ['YYYY', 4], 0, 'year'),
          W(0, ['YYYYY', 5], 0, 'year'),
          W(0, ['YYYYYY', 6, !0], 0, 'year'),
          z('year', 'y'),
          C('year', 1),
          le('Y', ue),
          le('YY', ae, $),
          le('YYYY', de, X),
          le('YYYYY', re, ee),
          le('YYYYYY', re, ee),
          Le(['YYYYY', 'YYYYYY'], fe),
          Le('YYYY', function (e, a) {
            a[fe] = 2 === e.length ? t.parseTwoDigitYear(e) : G(e);
          }),
          Le('YY', function (e, a) {
            a[fe] = t.parseTwoDigitYear(e);
          }),
          Le('Y', function (e, a) {
            a[fe] = parseInt(e, 10);
          }),
          (t.parseTwoDigitYear = function (e) {
            return G(e) + (68 < G(e) ? 1900 : 2e3);
          });
        var ze = V('FullYear', !0);
        function Ne(e) {
          var a, t;
          return e < 100 && 0 <= e ? (((t = Array.prototype.slice.call(arguments))[0] = e + 400), (a = new Date(Date.UTC.apply(null, t))), isFinite(a.getUTCFullYear()) && a.setUTCFullYear(e)) : (a = new Date(Date.UTC.apply(null, arguments))), a;
        }
        function Je(e, a, t) {
          var s = 7 + a - t;
          return s - ((7 + Ne(e, 0, s).getUTCDay() - a) % 7) - 1;
        }
        function Re(e, a, t, s, n) {
          var d,
            r = 1 + 7 * (a - 1) + ((7 + t - s) % 7) + Je(e, s, n),
            i = r <= 0 ? Fe((d = e - 1)) + r : r > Fe(e) ? ((d = e + 1), r - Fe(e)) : ((d = e), r);
          return { year: d, dayOfYear: i };
        }
        function Ce(e, a, t) {
          var s,
            n,
            d = Je(e.year(), a, t),
            r = Math.floor((e.dayOfYear() - d - 1) / 7) + 1;
          return r < 1 ? (s = r + Ie((n = e.year() - 1), a, t)) : r > Ie(e.year(), a, t) ? ((s = r - Ie(e.year(), a, t)), (n = e.year() + 1)) : ((n = e.year()), (s = r)), { week: s, year: n };
        }
        function Ie(e, a, t) {
          var s = Je(e, a, t),
            n = Je(e + 1, a, t);
          return (Fe(e) - s + n) / 7;
        }
        W('w', ['ww', 2], 'wo', 'week'),
          W('W', ['WW', 2], 'Wo', 'isoWeek'),
          z('week', 'w'),
          z('isoWeek', 'W'),
          C('week', 5),
          C('isoWeek', 5),
          le('w', ae),
          le('ww', ae, $),
          le('W', ae),
          le('WW', ae, $),
          Ye(['w', 'ww', 'W', 'WW'], function (e, a, t, s) {
            a[s.substr(0, 1)] = G(e);
          });
        function Ue(e, a) {
          return e.slice(a, 7).concat(e.slice(0, a));
        }
        W('d', 0, 'do', 'day'),
          W('dd', 0, 0, function (e) {
            return this.localeData().weekdaysMin(this, e);
          }),
          W('ddd', 0, 0, function (e) {
            return this.localeData().weekdaysShort(this, e);
          }),
          W('dddd', 0, 0, function (e) {
            return this.localeData().weekdays(this, e);
          }),
          W('e', 0, 0, 'weekday'),
          W('E', 0, 0, 'isoWeekday'),
          z('day', 'd'),
          z('weekday', 'e'),
          z('isoWeekday', 'E'),
          C('day', 11),
          C('weekday', 11),
          C('isoWeekday', 11),
          le('d', ae),
          le('e', ae),
          le('E', ae),
          le('dd', function (e, a) {
            return a.weekdaysMinRegex(e);
          }),
          le('ddd', function (e, a) {
            return a.weekdaysShortRegex(e);
          }),
          le('dddd', function (e, a) {
            return a.weekdaysRegex(e);
          }),
          Ye(['dd', 'ddd', 'dddd'], function (e, a, t, s) {
            var n = t._locale.weekdaysParse(e, s, t._strict);
            null != n ? (a.d = n) : (M(t).invalidWeekday = e);
          }),
          Ye(['d', 'e', 'E'], function (e, a, t, s) {
            a[s] = G(e);
          });
        var Ge = 'Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday'.split('_'),
          Ve = 'Sun_Mon_Tue_Wed_Thu_Fri_Sat'.split('_'),
          Be = 'Su_Mo_Tu_We_Th_Fr_Sa'.split('_'),
          Ke = me,
          qe = me,
          Ze = me;
        function $e() {
          function e(e, a) {
            return a.length - e.length;
          }
          for (var a, t, s, n, d = [], r = [], i = [], u = [], _ = 0; _ < 7; _++) (a = l([2e3, 1]).day(_)), (t = he(this.weekdaysMin(a, ''))), (s = he(this.weekdaysShort(a, ''))), (n = he(this.weekdays(a, ''))), d.push(t), r.push(s), i.push(n), u.push(t), u.push(s), u.push(n);
          d.sort(e),
            r.sort(e),
            i.sort(e),
            u.sort(e),
            (this._weekdaysRegex = new RegExp('^(' + u.join('|') + ')', 'i')),
            (this._weekdaysShortRegex = this._weekdaysRegex),
            (this._weekdaysMinRegex = this._weekdaysRegex),
            (this._weekdaysStrictRegex = new RegExp('^(' + i.join('|') + ')', 'i')),
            (this._weekdaysShortStrictRegex = new RegExp('^(' + r.join('|') + ')', 'i')),
            (this._weekdaysMinStrictRegex = new RegExp('^(' + d.join('|') + ')', 'i'));
        }
        function Qe() {
          return this.hours() % 12 || 12;
        }
        function Xe(e, a) {
          W(e, 0, 0, function () {
            return this.localeData().meridiem(this.hours(), this.minutes(), a);
          });
        }
        function ea(e, a) {
          return a._meridiemParse;
        }
        W('H', ['HH', 2], 0, 'hour'),
          W('h', ['hh', 2], 0, Qe),
          W('k', ['kk', 2], 0, function () {
            return this.hours() || 24;
          }),
          W('hmm', 0, 0, function () {
            return '' + Qe.apply(this) + H(this.minutes(), 2);
          }),
          W('hmmss', 0, 0, function () {
            return '' + Qe.apply(this) + H(this.minutes(), 2) + H(this.seconds(), 2);
          }),
          W('Hmm', 0, 0, function () {
            return '' + this.hours() + H(this.minutes(), 2);
          }),
          W('Hmmss', 0, 0, function () {
            return '' + this.hours() + H(this.minutes(), 2) + H(this.seconds(), 2);
          }),
          Xe('a', !0),
          Xe('A', !1),
          z('hour', 'h'),
          C('hour', 13),
          le('a', ea),
          le('A', ea),
          le('H', ae),
          le('h', ae),
          le('k', ae),
          le('HH', ae, $),
          le('hh', ae, $),
          le('kk', ae, $),
          le('hmm', te),
          le('hmmss', se),
          le('Hmm', te),
          le('Hmmss', se),
          Le(['H', 'HH'], De),
          Le(['k', 'kk'], function (e, a, t) {
            var s = G(e);
            a[De] = 24 === s ? 0 : s;
          }),
          Le(['a', 'A'], function (e, a, t) {
            (t._isPm = t._locale.isPM(e)), (t._meridiem = e);
          }),
          Le(['h', 'hh'], function (e, a, t) {
            (a[De] = G(e)), (M(t).bigHour = !0);
          }),
          Le('hmm', function (e, a, t) {
            var s = e.length - 2;
            (a[De] = G(e.substr(0, s))), (a[Te] = G(e.substr(s))), (M(t).bigHour = !0);
          }),
          Le('hmmss', function (e, a, t) {
            var s = e.length - 4,
              n = e.length - 2;
            (a[De] = G(e.substr(0, s))), (a[Te] = G(e.substr(s, 2))), (a[ge] = G(e.substr(n))), (M(t).bigHour = !0);
          }),
          Le('Hmm', function (e, a, t) {
            var s = e.length - 2;
            (a[De] = G(e.substr(0, s))), (a[Te] = G(e.substr(s)));
          }),
          Le('Hmmss', function (e, a, t) {
            var s = e.length - 4,
              n = e.length - 2;
            (a[De] = G(e.substr(0, s))), (a[Te] = G(e.substr(s, 2))), (a[ge] = G(e.substr(n)));
          });
        var aa = V('Hours', !0);
        var ta,
          sa = {
            calendar: { sameDay: '[Today at] LT', nextDay: '[Tomorrow at] LT', nextWeek: 'dddd [at] LT', lastDay: '[Yesterday at] LT', lastWeek: '[Last] dddd [at] LT', sameElse: 'L' },
            longDateFormat: { LTS: 'h:mm:ss A', LT: 'h:mm A', L: 'MM/DD/YYYY', LL: 'MMMM D, YYYY', LLL: 'MMMM D, YYYY h:mm A', LLLL: 'dddd, MMMM D, YYYY h:mm A' },
            invalidDate: 'Invalid date',
            ordinal: '%d',
            dayOfMonthOrdinalParse: /\d{1,2}/,
            relativeTime: { future: 'in %s', past: '%s ago', s: 'a few seconds', ss: '%d seconds', m: 'a minute', mm: '%d minutes', h: 'an hour', hh: '%d hours', d: 'a day', dd: '%d days', w: 'a week', ww: '%d weeks', M: 'a month', MM: '%d months', y: 'a year', yy: '%d years' },
            months: He,
            monthsShort: je,
            week: { dow: 0, doy: 6 },
            weekdays: Ge,
            weekdaysMin: Be,
            weekdaysShort: Ve,
            meridiemParse: /[ap]\.?m?\.?/i,
          },
          na = {},
          da = {};
        function ra(e) {
          return e ? e.toLowerCase().replace('_', '-') : e;
        }
        function ia(e) {
          for (var a, t, s, n, d = 0; d < e.length; ) {
            for (a = (n = ra(e[d]).split('-')).length, t = (t = ra(e[d + 1])) ? t.split('-') : null; 0 < a; ) {
              if ((s = ua(n.slice(0, a).join('-')))) return s;
              if (
                t &&
                t.length >= a &&
                (function (e, a) {
                  for (var t = Math.min(e.length, a.length), s = 0; s < t; s += 1) if (e[s] !== a[s]) return s;
                  return t;
                })(n, t) >=
                  a - 1
              )
                break;
              a--;
            }
            d++;
          }
          return ta;
        }
        function ua(e) {
          var a;
          if (void 0 === na[e] && 'undefined' != typeof module && module && module.exports)
            try {
              (a = ta._abbr), require('./locale/' + e), _a(a);
            } catch (a) {
              na[e] = null;
            }
          return na[e];
        }
        function _a(e, a) {
          var t;
          return e && ((t = i(a) ? ma(e) : oa(e, a)) ? (ta = t) : 'undefined' != typeof console && console.warn && console.warn('Locale ' + e + ' not found. Did you forget to load it?')), ta._abbr;
        }
        function oa(e, a) {
          if (null === a) return delete na[e], null;
          var t,
            s = sa;
          if (((a.abbr = e), null != na[e]))
            w('defineLocaleOverride', 'use moment.updateLocale(localeName, config) to change an existing locale. moment.defineLocale(localeName, config) should only be used for creating a new locale See http://momentjs.com/guides/#/warnings/define-locale/ for more info.'), (s = na[e]._config);
          else if (null != a.parentLocale)
            if (null != na[a.parentLocale]) s = na[a.parentLocale]._config;
            else {
              if (null == (t = ua(a.parentLocale))) return da[a.parentLocale] || (da[a.parentLocale] = []), da[a.parentLocale].push({ name: e, config: a }), null;
              s = t._config;
            }
          return (
            (na[e] = new S(v(s, a))),
            da[e] &&
              da[e].forEach(function (e) {
                oa(e.name, e.config);
              }),
            _a(e),
            na[e]
          );
        }
        function ma(e) {
          var a;
          if ((e && e._locale && e._locale._abbr && (e = e._locale._abbr), !e)) return ta;
          if (!s(e)) {
            if ((a = ua(e))) return a;
            e = [e];
          }
          return ia(e);
        }
        function la(e) {
          var a,
            t = e._a;
          return (
            t &&
              -2 === M(e).overflow &&
              ((a = t[pe] < 0 || 11 < t[pe] ? pe : t[ke] < 1 || t[ke] > Se(t[fe], t[pe]) ? ke : t[De] < 0 || 24 < t[De] || (24 === t[De] && (0 !== t[Te] || 0 !== t[ge] || 0 !== t[we])) ? De : t[Te] < 0 || 59 < t[Te] ? Te : t[ge] < 0 || 59 < t[ge] ? ge : t[we] < 0 || 999 < t[we] ? we : -1),
              M(e)._overflowDayOfYear && (a < fe || ke < a) && (a = ke),
              M(e)._overflowWeeks && -1 === a && (a = be),
              M(e)._overflowWeekday && -1 === a && (a = ve),
              (M(e).overflow = a)),
            e
          );
        }
        var Ma = /^\s*((?:[+-]\d{6}|\d{4})-(?:\d\d-\d\d|W\d\d-\d|W\d\d|\d\d\d|\d\d))(?:(T| )(\d\d(?::\d\d(?::\d\d(?:[.,]\d+)?)?)?)([+-]\d\d(?::?\d\d)?|\s*Z)?)?$/,
          ha = /^\s*((?:[+-]\d{6}|\d{4})(?:\d\d\d\d|W\d\d\d|W\d\d|\d\d\d|\d\d|))(?:(T| )(\d\d(?:\d\d(?:\d\d(?:[.,]\d+)?)?)?)([+-]\d\d(?::?\d\d)?|\s*Z)?)?$/,
          ca = /Z|[+-]\d\d(?::?\d\d)?/,
          La = [
            ['YYYYYY-MM-DD', /[+-]\d{6}-\d\d-\d\d/],
            ['YYYY-MM-DD', /\d{4}-\d\d-\d\d/],
            ['GGGG-[W]WW-E', /\d{4}-W\d\d-\d/],
            ['GGGG-[W]WW', /\d{4}-W\d\d/, !1],
            ['YYYY-DDD', /\d{4}-\d{3}/],
            ['YYYY-MM', /\d{4}-\d\d/, !1],
            ['YYYYYYMMDD', /[+-]\d{10}/],
            ['YYYYMMDD', /\d{8}/],
            ['GGGG[W]WWE', /\d{4}W\d{3}/],
            ['GGGG[W]WW', /\d{4}W\d{2}/, !1],
            ['YYYYDDD', /\d{7}/],
            ['YYYYMM', /\d{6}/, !1],
            ['YYYY', /\d{4}/, !1],
          ],
          Ya = [
            ['HH:mm:ss.SSSS', /\d\d:\d\d:\d\d\.\d+/],
            ['HH:mm:ss,SSSS', /\d\d:\d\d:\d\d,\d+/],
            ['HH:mm:ss', /\d\d:\d\d:\d\d/],
            ['HH:mm', /\d\d:\d\d/],
            ['HHmmss.SSSS', /\d\d\d\d\d\d\.\d+/],
            ['HHmmss,SSSS', /\d\d\d\d\d\d,\d+/],
            ['HHmmss', /\d\d\d\d\d\d/],
            ['HHmm', /\d\d\d\d/],
            ['HH', /\d\d/],
          ],
          ya = /^\/?Date\((-?\d+)/i,
          fa = /^(?:(Mon|Tue|Wed|Thu|Fri|Sat|Sun),?\s)?(\d{1,2})\s(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s(\d{2,4})\s(\d\d):(\d\d)(?::(\d\d))?\s(?:(UT|GMT|[ECMP][SD]T)|([Zz])|([+-]\d{4}))$/,
          pa = { UT: 0, GMT: 0, EDT: -240, EST: -300, CDT: -300, CST: -360, MDT: -360, MST: -420, PDT: -420, PST: -480 };
        function ka(e) {
          var a,
            t,
            s,
            n,
            d,
            r,
            i = e._i,
            u = Ma.exec(i) || ha.exec(i);
          if (u) {
            for (M(e).iso = !0, a = 0, t = La.length; a < t; a++)
              if (La[a][1].exec(u[1])) {
                (n = La[a][0]), (s = !1 !== La[a][2]);
                break;
              }
            if (null == n) return void (e._isValid = !1);
            if (u[3]) {
              for (a = 0, t = Ya.length; a < t; a++)
                if (Ya[a][1].exec(u[3])) {
                  d = (u[2] || ' ') + Ya[a][0];
                  break;
                }
              if (null == d) return void (e._isValid = !1);
            }
            if (!s && null != d) return void (e._isValid = !1);
            if (u[4]) {
              if (!ca.exec(u[4])) return void (e._isValid = !1);
              r = 'Z';
            }
            (e._f = n + (d || '') + (r || '')), ba(e);
          } else e._isValid = !1;
        }
        function Da(e, a, t, s, n, d) {
          var r = [
            (function (e) {
              var a = parseInt(e, 10);
              {
                if (a <= 49) return 2e3 + a;
                if (a <= 999) return 1900 + a;
              }
              return a;
            })(e),
            je.indexOf(a),
            parseInt(t, 10),
            parseInt(s, 10),
            parseInt(n, 10),
          ];
          return d && r.push(parseInt(d, 10)), r;
        }
        function Ta(e) {
          var a,
            t,
            s,
            n,
            d = fa.exec(
              e._i
                .replace(/\([^)]*\)|[\n\t]/g, ' ')
                .replace(/(\s\s+)/g, ' ')
                .replace(/^\s\s*/, '')
                .replace(/\s\s*$/, '')
            );
          if (d) {
            if (((a = Da(d[4], d[3], d[2], d[5], d[6], d[7])), (t = d[1]), (s = a), (n = e), t && Ve.indexOf(t) !== new Date(s[0], s[1], s[2]).getDay() && ((M(n).weekdayMismatch = !0), !void (n._isValid = !1)))) return;
            (e._a = a),
              (e._tzm = (function (e, a, t) {
                if (e) return pa[e];
                if (a) return 0;
                var s = parseInt(t, 10),
                  n = s % 100;
                return 60 * ((s - n) / 100) + n;
              })(d[8], d[9], d[10])),
              (e._d = Ne.apply(null, e._a)),
              e._d.setUTCMinutes(e._d.getUTCMinutes() - e._tzm),
              (M(e).rfc2822 = !0);
          } else e._isValid = !1;
        }
        function ga(e, a, t) {
          return null != e ? e : null != a ? a : t;
        }
        function wa(e) {
          var a,
            s,
            n,
            d,
            r,
            i,
            u,
            _ = [];
          if (!e._d) {
            for (
              i = e,
                u = new Date(t.now()),
                n = i._useUTC ? [u.getUTCFullYear(), u.getUTCMonth(), u.getUTCDate()] : [u.getFullYear(), u.getMonth(), u.getDate()],
                e._w &&
                  null == e._a[ke] &&
                  null == e._a[pe] &&
                  (function (e) {
                    var a, t, s, n, d, r, i, u, _;
                    null != (a = e._w).GG || null != a.W || null != a.E
                      ? ((d = 1), (r = 4), (t = ga(a.GG, e._a[fe], Ce(Ha(), 1, 4).year)), (s = ga(a.W, 1)), ((n = ga(a.E, 1)) < 1 || 7 < n) && (u = !0))
                      : ((d = e._locale._week.dow), (r = e._locale._week.doy), (_ = Ce(Ha(), d, r)), (t = ga(a.gg, e._a[fe], _.year)), (s = ga(a.w, _.week)), null != a.d ? ((n = a.d) < 0 || 6 < n) && (u = !0) : null != a.e ? ((n = a.e + d), (a.e < 0 || 6 < a.e) && (u = !0)) : (n = d));
                    s < 1 || s > Ie(t, d, r) ? (M(e)._overflowWeeks = !0) : null != u ? (M(e)._overflowWeekday = !0) : ((i = Re(t, s, n, d, r)), (e._a[fe] = i.year), (e._dayOfYear = i.dayOfYear));
                  })(e),
                null != e._dayOfYear && ((r = ga(e._a[fe], n[fe])), (e._dayOfYear > Fe(r) || 0 === e._dayOfYear) && (M(e)._overflowDayOfYear = !0), (s = Ne(r, 0, e._dayOfYear)), (e._a[pe] = s.getUTCMonth()), (e._a[ke] = s.getUTCDate())),
                a = 0;
              a < 3 && null == e._a[a];
              ++a
            )
              e._a[a] = _[a] = n[a];
            for (; a < 7; a++) e._a[a] = _[a] = null == e._a[a] ? (2 === a ? 1 : 0) : e._a[a];
            24 === e._a[De] && 0 === e._a[Te] && 0 === e._a[ge] && 0 === e._a[we] && ((e._nextDay = !0), (e._a[De] = 0)),
              (e._d = (
                e._useUTC
                  ? Ne
                  : function (e, a, t, s, n, d, r) {
                      var i;
                      return e < 100 && 0 <= e ? ((i = new Date(e + 400, a, t, s, n, d, r)), isFinite(i.getFullYear()) && i.setFullYear(e)) : (i = new Date(e, a, t, s, n, d, r)), i;
                    }
              ).apply(null, _)),
              (d = e._useUTC ? e._d.getUTCDay() : e._d.getDay()),
              null != e._tzm && e._d.setUTCMinutes(e._d.getUTCMinutes() - e._tzm),
              e._nextDay && (e._a[De] = 24),
              e._w && void 0 !== e._w.d && e._w.d !== d && (M(e).weekdayMismatch = !0);
          }
        }
        function ba(e) {
          if (e._f !== t.ISO_8601)
            if (e._f !== t.RFC_2822) {
              (e._a = []), (M(e).empty = !0);
              for (var a, s, n, r, i, u, _, o = '' + e._i, m = o.length, l = 0, h = E(e._f, e._locale).match(j) || [], c = 0; c < h.length; c++)
                (s = h[c]),
                  (a = (o.match(Me(s, e)) || [])[0]) && (0 < (n = o.substr(0, o.indexOf(a))).length && M(e).unusedInput.push(n), (o = o.slice(o.indexOf(a) + a.length)), (l += a.length)),
                  O[s] ? (a ? (M(e).empty = !1) : M(e).unusedTokens.push(s), (i = s), (_ = e), null != (u = a) && d(ce, i) && ce[i](u, _._a, _, i)) : e._strict && !a && M(e).unusedTokens.push(s);
              (M(e).charsLeftOver = m - l),
                0 < o.length && M(e).unusedInput.push(o),
                e._a[De] <= 12 && !0 === M(e).bigHour && 0 < e._a[De] && (M(e).bigHour = void 0),
                (M(e).parsedDateParts = e._a.slice(0)),
                (M(e).meridiem = e._meridiem),
                (e._a[De] = (function (e, a, t) {
                  var s;
                  if (null == t) return a;
                  return null != e.meridiemHour ? e.meridiemHour(a, t) : (null != e.isPM && ((s = e.isPM(t)) && a < 12 && (a += 12), s || 12 !== a || (a = 0)), a);
                })(e._locale, e._a[De], e._meridiem)),
                null !== (r = M(e).era) && (e._a[fe] = e._locale.erasConvertYear(r, e._a[fe])),
                wa(e),
                la(e);
            } else Ta(e);
          else ka(e);
        }
        function va(e) {
          var a,
            d,
            r = e._i,
            l = e._f;
          return (
            (e._locale = e._locale || ma(e._l)),
            null === r || (void 0 === l && '' === r)
              ? c({ nullInput: !0 })
              : ('string' == typeof r && (e._i = r = e._locale.preparse(r)),
                p(r)
                  ? new f(la(r))
                  : (_(r)
                      ? (e._d = r)
                      : s(l)
                      ? (function (e) {
                          var a,
                            t,
                            s,
                            n,
                            d,
                            r,
                            i = !1;
                          if (0 === e._f.length) return (M(e).invalidFormat = !0), (e._d = new Date(NaN));
                          for (n = 0; n < e._f.length; n++)
                            (d = 0),
                              (r = !1),
                              (a = y({}, e)),
                              null != e._useUTC && (a._useUTC = e._useUTC),
                              (a._f = e._f[n]),
                              ba(a),
                              h(a) && (r = !0),
                              (d += M(a).charsLeftOver),
                              (d += 10 * M(a).unusedTokens.length),
                              (M(a).score = d),
                              i ? d < s && ((s = d), (t = a)) : (null == s || d < s || r) && ((s = d), (t = a), r && (i = !0));
                          m(e, t || a);
                        })(e)
                      : l
                      ? ba(e)
                      : i((d = (a = e)._i))
                      ? (a._d = new Date(t.now()))
                      : _(d)
                      ? (a._d = new Date(d.valueOf()))
                      : 'string' == typeof d
                      ? (function (e) {
                          var a = ya.exec(e._i);
                          null === a ? (ka(e), !1 === e._isValid && (delete e._isValid, Ta(e), !1 === e._isValid && (delete e._isValid, e._strict ? (e._isValid = !1) : t.createFromInputFallback(e)))) : (e._d = new Date(+a[1]));
                        })(a)
                      : s(d)
                      ? ((a._a = o(d.slice(0), function (e) {
                          return parseInt(e, 10);
                        })),
                        wa(a))
                      : n(d)
                      ? (function (e) {
                          var a, t;
                          e._d ||
                            ((t = void 0 === (a = J(e._i)).day ? a.date : a.day),
                            (e._a = o([a.year, a.month, t, a.hour, a.minute, a.second, a.millisecond], function (e) {
                              return e && parseInt(e, 10);
                            })),
                            wa(e));
                        })(a)
                      : u(d)
                      ? (a._d = new Date(d))
                      : t.createFromInputFallback(a),
                    h(e) || (e._d = null),
                    e))
          );
        }
        function Sa(e, a, t, d, i) {
          var u,
            _ = {};
          return (
            (!0 !== a && !1 !== a) || ((d = a), (a = void 0)),
            (!0 !== t && !1 !== t) || ((d = t), (t = void 0)),
            ((n(e) && r(e)) || (s(e) && 0 === e.length)) && (e = void 0),
            (_._isAMomentObject = !0),
            (_._useUTC = _._isUTC = i),
            (_._l = t),
            (_._i = e),
            (_._f = a),
            (_._strict = d),
            (u = new f(la(va(_))))._nextDay && (u.add(1, 'd'), (u._nextDay = void 0)),
            u
          );
        }
        function Ha(e, a, t, s) {
          return Sa(e, a, t, s, !1);
        }
        (t.createFromInputFallback = D(
          'value provided is not in a recognized RFC2822 or ISO format. moment construction falls back to js Date(), which is not reliable across all browsers and versions. Non RFC2822/ISO date formats are discouraged. Please refer to http://momentjs.com/guides/#/warnings/js-date/ for more info.',
          function (e) {
            e._d = new Date(e._i + (e._useUTC ? ' UTC' : ''));
          }
        )),
          (t.ISO_8601 = function () {}),
          (t.RFC_2822 = function () {});
        var ja = D('moment().min is deprecated, use moment.max instead. http://momentjs.com/guides/#/warnings/min-max/', function () {
            var e = Ha.apply(null, arguments);
            return this.isValid() && e.isValid() ? (e < this ? this : e) : c();
          }),
          xa = D('moment().max is deprecated, use moment.min instead. http://momentjs.com/guides/#/warnings/min-max/', function () {
            var e = Ha.apply(null, arguments);
            return this.isValid() && e.isValid() ? (this < e ? this : e) : c();
          });
        function Pa(e, a) {
          var t, n;
          if ((1 === a.length && s(a[0]) && (a = a[0]), !a.length)) return Ha();
          for (t = a[0], n = 1; n < a.length; ++n) (a[n].isValid() && !a[n][e](t)) || (t = a[n]);
          return t;
        }
        var Oa = ['year', 'quarter', 'month', 'week', 'day', 'hour', 'minute', 'second', 'millisecond'];
        function Wa(e) {
          var a = J(e),
            t = a.year || 0,
            s = a.quarter || 0,
            n = a.month || 0,
            r = a.week || a.isoWeek || 0,
            i = a.day || 0,
            u = a.hour || 0,
            _ = a.minute || 0,
            o = a.second || 0,
            m = a.millisecond || 0;
          (this._isValid = (function (e) {
            var a,
              t,
              s = !1;
            for (a in e) if (d(e, a) && (-1 === ye.call(Oa, a) || (null != e[a] && isNaN(e[a])))) return !1;
            for (t = 0; t < Oa.length; ++t)
              if (e[Oa[t]]) {
                if (s) return !1;
                parseFloat(e[Oa[t]]) !== G(e[Oa[t]]) && (s = !0);
              }
            return !0;
          })(a)),
            (this._milliseconds = +m + 1e3 * o + 6e4 * _ + 1e3 * u * 60 * 60),
            (this._days = +i + 7 * r),
            (this._months = +n + 3 * s + 12 * t),
            (this._data = {}),
            (this._locale = ma()),
            this._bubble();
        }
        function Aa(e) {
          return e instanceof Wa;
        }
        function Ea(e) {
          return e < 0 ? -1 * Math.round(-1 * e) : Math.round(e);
        }
        function Fa(e, a) {
          W(e, 0, 0, function () {
            var e = this.utcOffset(),
              t = '+';
            return e < 0 && ((e = -e), (t = '-')), t + H(~~(e / 60), 2) + a + H(~~e % 60, 2);
          });
        }
        Fa('Z', ':'),
          Fa('ZZ', ''),
          le('Z', oe),
          le('ZZ', oe),
          Le(['Z', 'ZZ'], function (e, a, t) {
            (t._useUTC = !0), (t._tzm = Na(oe, e));
          });
        var za = /([\+\-]|\d\d)/gi;
        function Na(e, a) {
          var t,
            s,
            n = (a || '').match(e);
          return null === n ? null : 0 === (s = 60 * (t = ((n[n.length - 1] || []) + '').match(za) || ['-', 0, 0])[1] + G(t[2])) ? 0 : '+' === t[0] ? s : -s;
        }
        function Ja(e, a) {
          var s, n;
          return a._isUTC ? ((s = a.clone()), (n = (p(e) || _(e) ? e.valueOf() : Ha(e).valueOf()) - s.valueOf()), s._d.setTime(s._d.valueOf() + n), t.updateOffset(s, !1), s) : Ha(e).local();
        }
        function Ra(e) {
          return -Math.round(e._d.getTimezoneOffset());
        }
        function Ca() {
          return !!this.isValid() && this._isUTC && 0 === this._offset;
        }
        t.updateOffset = function () {};
        var Ia = /^(-|\+)?(?:(\d*)[. ])?(\d+):(\d+)(?::(\d+)(\.\d*)?)?$/,
          Ua = /^(-|\+)?P(?:([-+]?[0-9,.]*)Y)?(?:([-+]?[0-9,.]*)M)?(?:([-+]?[0-9,.]*)W)?(?:([-+]?[0-9,.]*)D)?(?:T(?:([-+]?[0-9,.]*)H)?(?:([-+]?[0-9,.]*)M)?(?:([-+]?[0-9,.]*)S)?)?$/;
        function Ga(e, a) {
          var t,
            s,
            n,
            r = e,
            i = null;
          return (
            Aa(e)
              ? (r = { ms: e._milliseconds, d: e._days, M: e._months })
              : u(e) || !isNaN(+e)
              ? ((r = {}), a ? (r[a] = +e) : (r.milliseconds = +e))
              : (i = Ia.exec(e))
              ? ((t = '-' === i[1] ? -1 : 1), (r = { y: 0, d: G(i[ke]) * t, h: G(i[De]) * t, m: G(i[Te]) * t, s: G(i[ge]) * t, ms: G(Ea(1e3 * i[we])) * t }))
              : (i = Ua.exec(e))
              ? ((t = '-' === i[1] ? -1 : 1), (r = { y: Va(i[2], t), M: Va(i[3], t), w: Va(i[4], t), d: Va(i[5], t), h: Va(i[6], t), m: Va(i[7], t), s: Va(i[8], t) }))
              : null == r
              ? (r = {})
              : 'object' == typeof r &&
                ('from' in r || 'to' in r) &&
                ((n = (function (e, a) {
                  var t;
                  if (!e.isValid() || !a.isValid()) return { milliseconds: 0, months: 0 };
                  (a = Ja(a, e)), e.isBefore(a) ? (t = Ba(e, a)) : (((t = Ba(a, e)).milliseconds = -t.milliseconds), (t.months = -t.months));
                  return t;
                })(Ha(r.from), Ha(r.to))),
                ((r = {}).ms = n.milliseconds),
                (r.M = n.months)),
            (s = new Wa(r)),
            Aa(e) && d(e, '_locale') && (s._locale = e._locale),
            Aa(e) && d(e, '_isValid') && (s._isValid = e._isValid),
            s
          );
        }
        function Va(e, a) {
          var t = e && parseFloat(e.replace(',', '.'));
          return (isNaN(t) ? 0 : t) * a;
        }
        function Ba(e, a) {
          var t = {};
          return (t.months = a.month() - e.month() + 12 * (a.year() - e.year())), e.clone().add(t.months, 'M').isAfter(a) && --t.months, (t.milliseconds = a - e.clone().add(t.months, 'M')), t;
        }
        function Ka(e, a) {
          return function (t, s) {
            var n;
            return null === s || isNaN(+s) || (w(a, 'moment().' + a + '(period, number) is deprecated. Please use moment().' + a + '(number, period). See http://momentjs.com/guides/#/warnings/add-inverted-param/ for more info.'), (n = t), (t = s), (s = n)), qa(this, Ga(t, s), e), this;
          };
        }
        function qa(e, a, s, n) {
          var d = a._milliseconds,
            r = Ea(a._days),
            i = Ea(a._months);
          e.isValid() && ((n = null == n || n), i && We(e, B(e, 'Month') + i * s), r && K(e, 'Date', B(e, 'Date') + r * s), d && e._d.setTime(e._d.valueOf() + d * s), n && t.updateOffset(e, r || i));
        }
        (Ga.fn = Wa.prototype),
          (Ga.invalid = function () {
            return Ga(NaN);
          });
        var Za = Ka(1, 'add'),
          $a = Ka(-1, 'subtract');
        function Qa(e) {
          return 'string' == typeof e || e instanceof String;
        }
        function Xa(e) {
          return (
            p(e) ||
            _(e) ||
            Qa(e) ||
            u(e) ||
            (function (e) {
              var a = s(e),
                t = !1;
              a &&
                (t =
                  0 ===
                  e.filter(function (a) {
                    return !u(a) && Qa(e);
                  }).length);
              return a && t;
            })(e) ||
            (function (e) {
              var a,
                t,
                s = n(e) && !r(e),
                i = !1,
                u = ['years', 'year', 'y', 'months', 'month', 'M', 'days', 'day', 'd', 'dates', 'date', 'D', 'hours', 'hour', 'h', 'minutes', 'minute', 'm', 'seconds', 'second', 's', 'milliseconds', 'millisecond', 'ms'];
              for (a = 0; a < u.length; a += 1) (t = u[a]), (i = i || d(e, t));
              return s && i;
            })(e) ||
            null == e
          );
        }
        function et(e, a) {
          if (e.date() < a.date()) return -et(a, e);
          var t = 12 * (a.year() - e.year()) + (a.month() - e.month()),
            s = e.clone().add(t, 'months'),
            n = a - s < 0 ? (a - s) / (s - e.clone().add(t - 1, 'months')) : (a - s) / (e.clone().add(1 + t, 'months') - s);
          return -(t + n) || 0;
        }
        function at(e) {
          var a;
          return void 0 === e ? this._locale._abbr : (null != (a = ma(e)) && (this._locale = a), this);
        }
        (t.defaultFormat = 'YYYY-MM-DDTHH:mm:ssZ'), (t.defaultFormatUtc = 'YYYY-MM-DDTHH:mm:ss[Z]');
        var tt = D('moment().lang() is deprecated. Instead, use moment().localeData() to get the language configuration. Use moment().locale() to change languages.', function (e) {
          return void 0 === e ? this.localeData() : this.locale(e);
        });
        function st() {
          return this._locale;
        }
        var nt = 126227808e5;
        function dt(e, a) {
          return ((e % a) + a) % a;
        }
        function rt(e, a, t) {
          return e < 100 && 0 <= e ? new Date(e + 400, a, t) - nt : new Date(e, a, t).valueOf();
        }
        function it(e, a, t) {
          return e < 100 && 0 <= e ? Date.UTC(e + 400, a, t) - nt : Date.UTC(e, a, t);
        }
        function ut(e, a) {
          return a.erasAbbrRegex(e);
        }
        function _t() {
          for (var e = [], a = [], t = [], s = [], n = this.eras(), d = 0, r = n.length; d < r; ++d) a.push(he(n[d].name)), e.push(he(n[d].abbr)), t.push(he(n[d].narrow)), s.push(he(n[d].name)), s.push(he(n[d].abbr)), s.push(he(n[d].narrow));
          (this._erasRegex = new RegExp('^(' + s.join('|') + ')', 'i')), (this._erasNameRegex = new RegExp('^(' + a.join('|') + ')', 'i')), (this._erasAbbrRegex = new RegExp('^(' + e.join('|') + ')', 'i')), (this._erasNarrowRegex = new RegExp('^(' + t.join('|') + ')', 'i'));
        }
        function ot(e, a) {
          W(0, [e, e.length], 0, a);
        }
        function mt(e, a, t, s, n) {
          var d;
          return null == e
            ? Ce(this, s, n).year
            : ((d = Ie(e, s, n)) < a && (a = d),
              function (e, a, t, s, n) {
                var d = Re(e, a, t, s, n),
                  r = Ne(d.year, 0, d.dayOfYear);
                return this.year(r.getUTCFullYear()), this.month(r.getUTCMonth()), this.date(r.getUTCDate()), this;
              }.call(this, e, a, t, s, n));
        }
        W('N', 0, 0, 'eraAbbr'),
          W('NN', 0, 0, 'eraAbbr'),
          W('NNN', 0, 0, 'eraAbbr'),
          W('NNNN', 0, 0, 'eraName'),
          W('NNNNN', 0, 0, 'eraNarrow'),
          W('y', ['y', 1], 'yo', 'eraYear'),
          W('y', ['yy', 2], 0, 'eraYear'),
          W('y', ['yyy', 3], 0, 'eraYear'),
          W('y', ['yyyy', 4], 0, 'eraYear'),
          le('N', ut),
          le('NN', ut),
          le('NNN', ut),
          le('NNNN', function (e, a) {
            return a.erasNameRegex(e);
          }),
          le('NNNNN', function (e, a) {
            return a.erasNarrowRegex(e);
          }),
          Le(['N', 'NN', 'NNN', 'NNNN', 'NNNNN'], function (e, a, t, s) {
            var n = t._locale.erasParse(e, s, t._strict);
            n ? (M(t).era = n) : (M(t).invalidEra = e);
          }),
          le('y', ie),
          le('yy', ie),
          le('yyy', ie),
          le('yyyy', ie),
          le('yo', function (e, a) {
            return a._eraYearOrdinalRegex || ie;
          }),
          Le(['y', 'yy', 'yyy', 'yyyy'], fe),
          Le(['yo'], function (e, a, t, s) {
            var n;
            t._locale._eraYearOrdinalRegex && (n = e.match(t._locale._eraYearOrdinalRegex)), t._locale.eraYearOrdinalParse ? (a[fe] = t._locale.eraYearOrdinalParse(e, n)) : (a[fe] = parseInt(e, 10));
          }),
          W(0, ['gg', 2], 0, function () {
            return this.weekYear() % 100;
          }),
          W(0, ['GG', 2], 0, function () {
            return this.isoWeekYear() % 100;
          }),
          ot('gggg', 'weekYear'),
          ot('ggggg', 'weekYear'),
          ot('GGGG', 'isoWeekYear'),
          ot('GGGGG', 'isoWeekYear'),
          z('weekYear', 'gg'),
          z('isoWeekYear', 'GG'),
          C('weekYear', 1),
          C('isoWeekYear', 1),
          le('G', ue),
          le('g', ue),
          le('GG', ae, $),
          le('gg', ae, $),
          le('GGGG', de, X),
          le('gggg', de, X),
          le('GGGGG', re, ee),
          le('ggggg', re, ee),
          Ye(['gggg', 'ggggg', 'GGGG', 'GGGGG'], function (e, a, t, s) {
            a[s.substr(0, 2)] = G(e);
          }),
          Ye(['gg', 'GG'], function (e, a, s, n) {
            a[n] = t.parseTwoDigitYear(e);
          }),
          W('Q', 0, 'Qo', 'quarter'),
          z('quarter', 'Q'),
          C('quarter', 7),
          le('Q', Z),
          Le('Q', function (e, a) {
            a[pe] = 3 * (G(e) - 1);
          }),
          W('D', ['DD', 2], 'Do', 'date'),
          z('date', 'D'),
          C('date', 9),
          le('D', ae),
          le('DD', ae, $),
          le('Do', function (e, a) {
            return e ? a._dayOfMonthOrdinalParse || a._ordinalParse : a._dayOfMonthOrdinalParseLenient;
          }),
          Le(['D', 'DD'], ke),
          Le('Do', function (e, a) {
            a[ke] = G(e.match(ae)[0]);
          });
        var lt = V('Date', !0);
        W('DDD', ['DDDD', 3], 'DDDo', 'dayOfYear'),
          z('dayOfYear', 'DDD'),
          C('dayOfYear', 4),
          le('DDD', ne),
          le('DDDD', Q),
          Le(['DDD', 'DDDD'], function (e, a, t) {
            t._dayOfYear = G(e);
          }),
          W('m', ['mm', 2], 0, 'minute'),
          z('minute', 'm'),
          C('minute', 14),
          le('m', ae),
          le('mm', ae, $),
          Le(['m', 'mm'], Te);
        var Mt = V('Minutes', !1);
        W('s', ['ss', 2], 0, 'second'), z('second', 's'), C('second', 15), le('s', ae), le('ss', ae, $), Le(['s', 'ss'], ge);
        var ht,
          ct,
          Lt = V('Seconds', !1);
        for (
          W('S', 0, 0, function () {
            return ~~(this.millisecond() / 100);
          }),
            W(0, ['SS', 2], 0, function () {
              return ~~(this.millisecond() / 10);
            }),
            W(0, ['SSS', 3], 0, 'millisecond'),
            W(0, ['SSSS', 4], 0, function () {
              return 10 * this.millisecond();
            }),
            W(0, ['SSSSS', 5], 0, function () {
              return 100 * this.millisecond();
            }),
            W(0, ['SSSSSS', 6], 0, function () {
              return 1e3 * this.millisecond();
            }),
            W(0, ['SSSSSSS', 7], 0, function () {
              return 1e4 * this.millisecond();
            }),
            W(0, ['SSSSSSSS', 8], 0, function () {
              return 1e5 * this.millisecond();
            }),
            W(0, ['SSSSSSSSS', 9], 0, function () {
              return 1e6 * this.millisecond();
            }),
            z('millisecond', 'ms'),
            C('millisecond', 16),
            le('S', ne, Z),
            le('SS', ne, $),
            le('SSS', ne, Q),
            ht = 'SSSS';
          ht.length <= 9;
          ht += 'S'
        )
          le(ht, ie);
        function Yt(e, a) {
          a[we] = G(1e3 * ('0.' + e));
        }
        for (ht = 'S'; ht.length <= 9; ht += 'S') Le(ht, Yt);
        (ct = V('Milliseconds', !1)), W('z', 0, 0, 'zoneAbbr'), W('zz', 0, 0, 'zoneName');
        var yt = f.prototype;
        function ft(e) {
          return e;
        }
        (yt.add = Za),
          (yt.calendar = function (e, a) {
            1 === arguments.length &&
              (arguments[0]
                ? Xa(arguments[0])
                  ? ((e = arguments[0]), (a = void 0))
                  : (function (e) {
                      for (var a = n(e) && !r(e), t = !1, s = ['sameDay', 'nextDay', 'lastDay', 'nextWeek', 'lastWeek', 'sameElse'], i = 0; i < s.length; i += 1) t = t || d(e, s[i]);
                      return a && t;
                    })(arguments[0]) && ((a = arguments[0]), (e = void 0))
                : (a = e = void 0));
            var s = e || Ha(),
              i = Ja(s, this).startOf('day'),
              u = t.calendarFormat(this, i) || 'sameElse',
              _ = a && (b(a[u]) ? a[u].call(this, s) : a[u]);
            return this.format(_ || this.localeData().calendar(u, this, Ha(s)));
          }),
          (yt.clone = function () {
            return new f(this);
          }),
          (yt.diff = function (e, a, t) {
            var s, n, d;
            if (!this.isValid()) return NaN;
            if (!(s = Ja(e, this)).isValid()) return NaN;
            switch (((n = 6e4 * (s.utcOffset() - this.utcOffset())), (a = N(a)))) {
              case 'year':
                d = et(this, s) / 12;
                break;
              case 'month':
                d = et(this, s);
                break;
              case 'quarter':
                d = et(this, s) / 3;
                break;
              case 'second':
                d = (this - s) / 1e3;
                break;
              case 'minute':
                d = (this - s) / 6e4;
                break;
              case 'hour':
                d = (this - s) / 36e5;
                break;
              case 'day':
                d = (this - s - n) / 864e5;
                break;
              case 'week':
                d = (this - s - n) / 6048e5;
                break;
              default:
                d = this - s;
            }
            return t ? d : U(d);
          }),
          (yt.endOf = function (e) {
            var a, s;
            if (void 0 === (e = N(e)) || 'millisecond' === e || !this.isValid()) return this;
            switch (((s = this._isUTC ? it : rt), e)) {
              case 'year':
                a = s(this.year() + 1, 0, 1) - 1;
                break;
              case 'quarter':
                a = s(this.year(), this.month() - (this.month() % 3) + 3, 1) - 1;
                break;
              case 'month':
                a = s(this.year(), this.month() + 1, 1) - 1;
                break;
              case 'week':
                a = s(this.year(), this.month(), this.date() - this.weekday() + 7) - 1;
                break;
              case 'isoWeek':
                a = s(this.year(), this.month(), this.date() - (this.isoWeekday() - 1) + 7) - 1;
                break;
              case 'day':
              case 'date':
                a = s(this.year(), this.month(), this.date() + 1) - 1;
                break;
              case 'hour':
                (a = this._d.valueOf()), (a += 36e5 - dt(a + (this._isUTC ? 0 : 6e4 * this.utcOffset()), 36e5) - 1);
                break;
              case 'minute':
                (a = this._d.valueOf()), (a += 6e4 - dt(a, 6e4) - 1);
                break;
              case 'second':
                (a = this._d.valueOf()), (a += 1e3 - dt(a, 1e3) - 1);
                break;
            }
            return this._d.setTime(a), t.updateOffset(this, !0), this;
          }),
          (yt.format = function (e) {
            e = e || (this.isUtc() ? t.defaultFormatUtc : t.defaultFormat);
            var a = A(this, e);
            return this.localeData().postformat(a);
          }),
          (yt.from = function (e, a) {
            return this.isValid() && ((p(e) && e.isValid()) || Ha(e).isValid()) ? Ga({ to: this, from: e }).locale(this.locale()).humanize(!a) : this.localeData().invalidDate();
          }),
          (yt.fromNow = function (e) {
            return this.from(Ha(), e);
          }),
          (yt.to = function (e, a) {
            return this.isValid() && ((p(e) && e.isValid()) || Ha(e).isValid()) ? Ga({ from: this, to: e }).locale(this.locale()).humanize(!a) : this.localeData().invalidDate();
          }),
          (yt.toNow = function (e) {
            return this.to(Ha(), e);
          }),
          (yt.get = function (e) {
            return b(this[(e = N(e))]) ? this[e]() : this;
          }),
          (yt.invalidAt = function () {
            return M(this).overflow;
          }),
          (yt.isAfter = function (e, a) {
            var t = p(e) ? e : Ha(e);
            return !(!this.isValid() || !t.isValid()) && ('millisecond' === (a = N(a) || 'millisecond') ? this.valueOf() > t.valueOf() : t.valueOf() < this.clone().startOf(a).valueOf());
          }),
          (yt.isBefore = function (e, a) {
            var t = p(e) ? e : Ha(e);
            return !(!this.isValid() || !t.isValid()) && ('millisecond' === (a = N(a) || 'millisecond') ? this.valueOf() < t.valueOf() : this.clone().endOf(a).valueOf() < t.valueOf());
          }),
          (yt.isBetween = function (e, a, t, s) {
            var n = p(e) ? e : Ha(e),
              d = p(a) ? a : Ha(a);
            return !!(this.isValid() && n.isValid() && d.isValid()) && ('(' === (s = s || '()')[0] ? this.isAfter(n, t) : !this.isBefore(n, t)) && (')' === s[1] ? this.isBefore(d, t) : !this.isAfter(d, t));
          }),
          (yt.isSame = function (e, a) {
            var t,
              s = p(e) ? e : Ha(e);
            return !(!this.isValid() || !s.isValid()) && ('millisecond' === (a = N(a) || 'millisecond') ? this.valueOf() === s.valueOf() : ((t = s.valueOf()), this.clone().startOf(a).valueOf() <= t && t <= this.clone().endOf(a).valueOf()));
          }),
          (yt.isSameOrAfter = function (e, a) {
            return this.isSame(e, a) || this.isAfter(e, a);
          }),
          (yt.isSameOrBefore = function (e, a) {
            return this.isSame(e, a) || this.isBefore(e, a);
          }),
          (yt.isValid = function () {
            return h(this);
          }),
          (yt.lang = tt),
          (yt.locale = at),
          (yt.localeData = st),
          (yt.max = xa),
          (yt.min = ja),
          (yt.parsingFlags = function () {
            return m({}, M(this));
          }),
          (yt.set = function (e, a) {
            if ('object' == typeof e)
              for (
                var t = (function (e) {
                    var a,
                      t = [];
                    for (a in e) d(e, a) && t.push({ unit: a, priority: R[a] });
                    return (
                      t.sort(function (e, a) {
                        return e.priority - a.priority;
                      }),
                      t
                    );
                  })((e = J(e))),
                  s = 0;
                s < t.length;
                s++
              )
                this[t[s].unit](e[t[s].unit]);
            else if (b(this[(e = N(e))])) return this[e](a);
            return this;
          }),
          (yt.startOf = function (e) {
            var a, s;
            if (void 0 === (e = N(e)) || 'millisecond' === e || !this.isValid()) return this;
            switch (((s = this._isUTC ? it : rt), e)) {
              case 'year':
                a = s(this.year(), 0, 1);
                break;
              case 'quarter':
                a = s(this.year(), this.month() - (this.month() % 3), 1);
                break;
              case 'month':
                a = s(this.year(), this.month(), 1);
                break;
              case 'week':
                a = s(this.year(), this.month(), this.date() - this.weekday());
                break;
              case 'isoWeek':
                a = s(this.year(), this.month(), this.date() - (this.isoWeekday() - 1));
                break;
              case 'day':
              case 'date':
                a = s(this.year(), this.month(), this.date());
                break;
              case 'hour':
                (a = this._d.valueOf()), (a -= dt(a + (this._isUTC ? 0 : 6e4 * this.utcOffset()), 36e5));
                break;
              case 'minute':
                (a = this._d.valueOf()), (a -= dt(a, 6e4));
                break;
              case 'second':
                (a = this._d.valueOf()), (a -= dt(a, 1e3));
                break;
            }
            return this._d.setTime(a), t.updateOffset(this, !0), this;
          }),
          (yt.subtract = $a),
          (yt.toArray = function () {
            var e = this;
            return [e.year(), e.month(), e.date(), e.hour(), e.minute(), e.second(), e.millisecond()];
          }),
          (yt.toObject = function () {
            var e = this;
            return { years: e.year(), months: e.month(), date: e.date(), hours: e.hours(), minutes: e.minutes(), seconds: e.seconds(), milliseconds: e.milliseconds() };
          }),
          (yt.toDate = function () {
            return new Date(this.valueOf());
          }),
          (yt.toISOString = function (e) {
            if (!this.isValid()) return null;
            var a = !0 !== e,
              t = a ? this.clone().utc() : this;
            return t.year() < 0 || 9999 < t.year()
              ? A(t, a ? 'YYYYYY-MM-DD[T]HH:mm:ss.SSS[Z]' : 'YYYYYY-MM-DD[T]HH:mm:ss.SSSZ')
              : b(Date.prototype.toISOString)
              ? a
                ? this.toDate().toISOString()
                : new Date(this.valueOf() + 60 * this.utcOffset() * 1e3).toISOString().replace('Z', A(t, 'Z'))
              : A(t, a ? 'YYYY-MM-DD[T]HH:mm:ss.SSS[Z]' : 'YYYY-MM-DD[T]HH:mm:ss.SSSZ');
          }),
          (yt.inspect = function () {
            if (!this.isValid()) return 'moment.invalid(/* ' + this._i + ' */)';
            var e,
              a,
              t,
              s = 'moment',
              n = '';
            return this.isLocal() || ((s = 0 === this.utcOffset() ? 'moment.utc' : 'moment.parseZone'), (n = 'Z')), (e = '[' + s + '("]'), (a = 0 <= this.year() && this.year() <= 9999 ? 'YYYY' : 'YYYYYY'), (t = n + '[")]'), this.format(e + a + '-MM-DD[T]HH:mm:ss.SSS' + t);
          }),
          'undefined' != typeof Symbol &&
            null != Symbol.for &&
            (yt[Symbol.for('nodejs.util.inspect.custom')] = function () {
              return 'Moment<' + this.format() + '>';
            }),
          (yt.toJSON = function () {
            return this.isValid() ? this.toISOString() : null;
          }),
          (yt.toString = function () {
            return this.clone().locale('en').format('ddd MMM DD YYYY HH:mm:ss [GMT]ZZ');
          }),
          (yt.unix = function () {
            return Math.floor(this.valueOf() / 1e3);
          }),
          (yt.valueOf = function () {
            return this._d.valueOf() - 6e4 * (this._offset || 0);
          }),
          (yt.creationData = function () {
            return { input: this._i, format: this._f, locale: this._locale, isUTC: this._isUTC, strict: this._strict };
          }),
          (yt.eraName = function () {
            for (var e, a = this.localeData().eras(), t = 0, s = a.length; t < s; ++t) {
              if (((e = this.clone().startOf('day').valueOf()), a[t].since <= e && e <= a[t].until)) return a[t].name;
              if (a[t].until <= e && e <= a[t].since) return a[t].name;
            }
            return '';
          }),
          (yt.eraNarrow = function () {
            for (var e, a = this.localeData().eras(), t = 0, s = a.length; t < s; ++t) {
              if (((e = this.clone().startOf('day').valueOf()), a[t].since <= e && e <= a[t].until)) return a[t].narrow;
              if (a[t].until <= e && e <= a[t].since) return a[t].narrow;
            }
            return '';
          }),
          (yt.eraAbbr = function () {
            for (var e, a = this.localeData().eras(), t = 0, s = a.length; t < s; ++t) {
              if (((e = this.clone().startOf('day').valueOf()), a[t].since <= e && e <= a[t].until)) return a[t].abbr;
              if (a[t].until <= e && e <= a[t].since) return a[t].abbr;
            }
            return '';
          }),
          (yt.eraYear = function () {
            for (var e, a, s = this.localeData().eras(), n = 0, d = s.length; n < d; ++n)
              if (((e = s[n].since <= s[n].until ? 1 : -1), (a = this.clone().startOf('day').valueOf()), (s[n].since <= a && a <= s[n].until) || (s[n].until <= a && a <= s[n].since))) return (this.year() - t(s[n].since).year()) * e + s[n].offset;
            return this.year();
          }),
          (yt.year = ze),
          (yt.isLeapYear = function () {
            return I(this.year());
          }),
          (yt.weekYear = function (e) {
            return mt.call(this, e, this.week(), this.weekday(), this.localeData()._week.dow, this.localeData()._week.doy);
          }),
          (yt.isoWeekYear = function (e) {
            return mt.call(this, e, this.isoWeek(), this.isoWeekday(), 1, 4);
          }),
          (yt.quarter = yt.quarters =
            function (e) {
              return null == e ? Math.ceil((this.month() + 1) / 3) : this.month(3 * (e - 1) + (this.month() % 3));
            }),
          (yt.month = Ae),
          (yt.daysInMonth = function () {
            return Se(this.year(), this.month());
          }),
          (yt.week = yt.weeks =
            function (e) {
              var a = this.localeData().week(this);
              return null == e ? a : this.add(7 * (e - a), 'd');
            }),
          (yt.isoWeek = yt.isoWeeks =
            function (e) {
              var a = Ce(this, 1, 4).week;
              return null == e ? a : this.add(7 * (e - a), 'd');
            }),
          (yt.weeksInYear = function () {
            var e = this.localeData()._week;
            return Ie(this.year(), e.dow, e.doy);
          }),
          (yt.weeksInWeekYear = function () {
            var e = this.localeData()._week;
            return Ie(this.weekYear(), e.dow, e.doy);
          }),
          (yt.isoWeeksInYear = function () {
            return Ie(this.year(), 1, 4);
          }),
          (yt.isoWeeksInISOWeekYear = function () {
            return Ie(this.isoWeekYear(), 1, 4);
          }),
          (yt.date = lt),
          (yt.day = yt.days =
            function (e) {
              if (!this.isValid()) return null != e ? this : NaN;
              var a,
                t,
                s = this._isUTC ? this._d.getUTCDay() : this._d.getDay();
              return null != e ? ((a = e), (t = this.localeData()), (e = 'string' != typeof a ? a : isNaN(a) ? ('number' == typeof (a = t.weekdaysParse(a)) ? a : null) : parseInt(a, 10)), this.add(e - s, 'd')) : s;
            }),
          (yt.weekday = function (e) {
            if (!this.isValid()) return null != e ? this : NaN;
            var a = (this.day() + 7 - this.localeData()._week.dow) % 7;
            return null == e ? a : this.add(e - a, 'd');
          }),
          (yt.isoWeekday = function (e) {
            if (!this.isValid()) return null != e ? this : NaN;
            if (null == e) return this.day() || 7;
            var a,
              t,
              s = ((a = e), (t = this.localeData()), 'string' == typeof a ? t.weekdaysParse(a) % 7 || 7 : isNaN(a) ? null : a);
            return this.day(this.day() % 7 ? s : s - 7);
          }),
          (yt.dayOfYear = function (e) {
            var a = Math.round((this.clone().startOf('day') - this.clone().startOf('year')) / 864e5) + 1;
            return null == e ? a : this.add(e - a, 'd');
          }),
          (yt.hour = yt.hours = aa),
          (yt.minute = yt.minutes = Mt),
          (yt.second = yt.seconds = Lt),
          (yt.millisecond = yt.milliseconds = ct),
          (yt.utcOffset = function (e, a, s) {
            var n,
              d = this._offset || 0;
            if (!this.isValid()) return null != e ? this : NaN;
            if (null == e) return this._isUTC ? d : Ra(this);
            if ('string' == typeof e) {
              if (null === (e = Na(oe, e))) return this;
            } else Math.abs(e) < 16 && !s && (e *= 60);
            return (
              !this._isUTC && a && (n = Ra(this)),
              (this._offset = e),
              (this._isUTC = !0),
              null != n && this.add(n, 'm'),
              d !== e && (!a || this._changeInProgress ? qa(this, Ga(e - d, 'm'), 1, !1) : this._changeInProgress || ((this._changeInProgress = !0), t.updateOffset(this, !0), (this._changeInProgress = null))),
              this
            );
          }),
          (yt.utc = function (e) {
            return this.utcOffset(0, e);
          }),
          (yt.local = function (e) {
            return this._isUTC && (this.utcOffset(0, e), (this._isUTC = !1), e && this.subtract(Ra(this), 'm')), this;
          }),
          (yt.parseZone = function () {
            var e;
            return null != this._tzm ? this.utcOffset(this._tzm, !1, !0) : 'string' == typeof this._i && (null != (e = Na(_e, this._i)) ? this.utcOffset(e) : this.utcOffset(0, !0)), this;
          }),
          (yt.hasAlignedHourOffset = function (e) {
            return !!this.isValid() && ((e = e ? Ha(e).utcOffset() : 0), (this.utcOffset() - e) % 60 == 0);
          }),
          (yt.isDST = function () {
            return this.utcOffset() > this.clone().month(0).utcOffset() || this.utcOffset() > this.clone().month(5).utcOffset();
          }),
          (yt.isLocal = function () {
            return !!this.isValid() && !this._isUTC;
          }),
          (yt.isUtcOffset = function () {
            return !!this.isValid() && this._isUTC;
          }),
          (yt.isUtc = Ca),
          (yt.isUTC = Ca),
          (yt.zoneAbbr = function () {
            return this._isUTC ? 'UTC' : '';
          }),
          (yt.zoneName = function () {
            return this._isUTC ? 'Coordinated Universal Time' : '';
          }),
          (yt.dates = D('dates accessor is deprecated. Use date instead.', lt)),
          (yt.months = D('months accessor is deprecated. Use month instead', Ae)),
          (yt.years = D('years accessor is deprecated. Use year instead', ze)),
          (yt.zone = D('moment().zone is deprecated, use moment().utcOffset instead. http://momentjs.com/guides/#/warnings/zone/', function (e, a) {
            return null != e ? ('string' != typeof e && (e = -e), this.utcOffset(e, a), this) : -this.utcOffset();
          })),
          (yt.isDSTShifted = D('isDSTShifted is deprecated. See http://momentjs.com/guides/#/warnings/dst-shifted/ for more information', function () {
            if (!i(this._isDSTShifted)) return this._isDSTShifted;
            var e,
              a = {};
            return (
              y(a, this),
              (a = va(a))._a
                ? ((e = (a._isUTC ? l : Ha)(a._a)),
                  (this._isDSTShifted =
                    this.isValid() &&
                    0 <
                      (function (e, a, t) {
                        for (var s = Math.min(e.length, a.length), n = Math.abs(e.length - a.length), d = 0, r = 0; r < s; r++) ((t && e[r] !== a[r]) || (!t && G(e[r]) !== G(a[r]))) && d++;
                        return d + n;
                      })(a._a, e.toArray())))
                : (this._isDSTShifted = !1),
              this._isDSTShifted
            );
          }));
        var pt = S.prototype;
        function kt(e, a, t, s) {
          var n = ma(),
            d = l().set(s, a);
          return n[t](d, e);
        }
        function Dt(e, a, t) {
          if ((u(e) && ((a = e), (e = void 0)), (e = e || ''), null != a)) return kt(e, a, t, 'month');
          for (var s = [], n = 0; n < 12; n++) s[n] = kt(e, n, t, 'month');
          return s;
        }
        function Tt(e, a, t, s) {
          a = ('boolean' == typeof e ? u(a) && ((t = a), (a = void 0)) : ((a = e), (e = !1), u((t = a)) && ((t = a), (a = void 0))), a || '');
          var n,
            d = ma(),
            r = e ? d._week.dow : 0,
            i = [];
          if (null != t) return kt(a, (t + r) % 7, s, 'day');
          for (n = 0; n < 7; n++) i[n] = kt(a, (n + r) % 7, s, 'day');
          return i;
        }
        (pt.calendar = function (e, a, t) {
          var s = this._calendar[e] || this._calendar.sameElse;
          return b(s) ? s.call(a, t) : s;
        }),
          (pt.longDateFormat = function (e) {
            var a = this._longDateFormat[e],
              t = this._longDateFormat[e.toUpperCase()];
            return a || !t
              ? a
              : ((this._longDateFormat[e] = t
                  .match(j)
                  .map(function (e) {
                    return 'MMMM' === e || 'MM' === e || 'DD' === e || 'dddd' === e ? e.slice(1) : e;
                  })
                  .join('')),
                this._longDateFormat[e]);
          }),
          (pt.invalidDate = function () {
            return this._invalidDate;
          }),
          (pt.ordinal = function (e) {
            return this._ordinal.replace('%d', e);
          }),
          (pt.preparse = ft),
          (pt.postformat = ft),
          (pt.relativeTime = function (e, a, t, s) {
            var n = this._relativeTime[t];
            return b(n) ? n(e, a, t, s) : n.replace(/%d/i, e);
          }),
          (pt.pastFuture = function (e, a) {
            var t = this._relativeTime[0 < e ? 'future' : 'past'];
            return b(t) ? t(a) : t.replace(/%s/i, a);
          }),
          (pt.set = function (e) {
            var a, t;
            for (t in e) d(e, t) && (b((a = e[t])) ? (this[t] = a) : (this['_' + t] = a));
            (this._config = e), (this._dayOfMonthOrdinalParseLenient = new RegExp((this._dayOfMonthOrdinalParse.source || this._ordinalParse.source) + '|' + /\d{1,2}/.source));
          }),
          (pt.eras = function (e, a) {
            for (var s, n = this._eras || ma('en')._eras, d = 0, r = n.length; d < r; ++d) {
              switch (typeof n[d].since) {
                case 'string':
                  (s = t(n[d].since).startOf('day')), (n[d].since = s.valueOf());
                  break;
              }
              switch (typeof n[d].until) {
                case 'undefined':
                  n[d].until = 1 / 0;
                  break;
                case 'string':
                  (s = t(n[d].until).startOf('day').valueOf()), (n[d].until = s.valueOf());
                  break;
              }
            }
            return n;
          }),
          (pt.erasParse = function (e, a, t) {
            var s,
              n,
              d,
              r,
              i,
              u = this.eras();
            for (e = e.toUpperCase(), s = 0, n = u.length; s < n; ++s)
              if (((d = u[s].name.toUpperCase()), (r = u[s].abbr.toUpperCase()), (i = u[s].narrow.toUpperCase()), t))
                switch (a) {
                  case 'N':
                  case 'NN':
                  case 'NNN':
                    if (r === e) return u[s];
                    break;
                  case 'NNNN':
                    if (d === e) return u[s];
                    break;
                  case 'NNNNN':
                    if (i === e) return u[s];
                    break;
                }
              else if (0 <= [d, r, i].indexOf(e)) return u[s];
          }),
          (pt.erasConvertYear = function (e, a) {
            var s = e.since <= e.until ? 1 : -1;
            return void 0 === a ? t(e.since).year() : t(e.since).year() + (a - e.offset) * s;
          }),
          (pt.erasAbbrRegex = function (e) {
            return d(this, '_erasAbbrRegex') || _t.call(this), e ? this._erasAbbrRegex : this._erasRegex;
          }),
          (pt.erasNameRegex = function (e) {
            return d(this, '_erasNameRegex') || _t.call(this), e ? this._erasNameRegex : this._erasRegex;
          }),
          (pt.erasNarrowRegex = function (e) {
            return d(this, '_erasNarrowRegex') || _t.call(this), e ? this._erasNarrowRegex : this._erasRegex;
          }),
          (pt.months = function (e, a) {
            return e ? (s(this._months) ? this._months[e.month()] : this._months[(this._months.isFormat || xe).test(a) ? 'format' : 'standalone'][e.month()]) : s(this._months) ? this._months : this._months.standalone;
          }),
          (pt.monthsShort = function (e, a) {
            return e ? (s(this._monthsShort) ? this._monthsShort[e.month()] : this._monthsShort[xe.test(a) ? 'format' : 'standalone'][e.month()]) : s(this._monthsShort) ? this._monthsShort : this._monthsShort.standalone;
          }),
          (pt.monthsParse = function (e, a, t) {
            var s, n, d;
            if (this._monthsParseExact)
              return function (e, a, t) {
                var s,
                  n,
                  d,
                  r = e.toLocaleLowerCase();
                if (!this._monthsParse)
                  for (this._monthsParse = [], this._longMonthsParse = [], this._shortMonthsParse = [], s = 0; s < 12; ++s) (d = l([2e3, s])), (this._shortMonthsParse[s] = this.monthsShort(d, '').toLocaleLowerCase()), (this._longMonthsParse[s] = this.months(d, '').toLocaleLowerCase());
                return t
                  ? 'MMM' === a
                    ? -1 !== (n = ye.call(this._shortMonthsParse, r))
                      ? n
                      : null
                    : -1 !== (n = ye.call(this._longMonthsParse, r))
                    ? n
                    : null
                  : 'MMM' === a
                  ? -1 !== (n = ye.call(this._shortMonthsParse, r)) || -1 !== (n = ye.call(this._longMonthsParse, r))
                    ? n
                    : null
                  : -1 !== (n = ye.call(this._longMonthsParse, r)) || -1 !== (n = ye.call(this._shortMonthsParse, r))
                  ? n
                  : null;
              }.call(this, e, a, t);
            for (this._monthsParse || ((this._monthsParse = []), (this._longMonthsParse = []), (this._shortMonthsParse = [])), s = 0; s < 12; s++) {
              if (
                ((n = l([2e3, s])),
                t && !this._longMonthsParse[s] && ((this._longMonthsParse[s] = new RegExp('^' + this.months(n, '').replace('.', '') + '$', 'i')), (this._shortMonthsParse[s] = new RegExp('^' + this.monthsShort(n, '').replace('.', '') + '$', 'i'))),
                t || this._monthsParse[s] || ((d = '^' + this.months(n, '') + '|^' + this.monthsShort(n, '')), (this._monthsParse[s] = new RegExp(d.replace('.', ''), 'i'))),
                t && 'MMMM' === a && this._longMonthsParse[s].test(e))
              )
                return s;
              if (t && 'MMM' === a && this._shortMonthsParse[s].test(e)) return s;
              if (!t && this._monthsParse[s].test(e)) return s;
            }
          }),
          (pt.monthsRegex = function (e) {
            return this._monthsParseExact ? (d(this, '_monthsRegex') || Ee.call(this), e ? this._monthsStrictRegex : this._monthsRegex) : (d(this, '_monthsRegex') || (this._monthsRegex = Oe), this._monthsStrictRegex && e ? this._monthsStrictRegex : this._monthsRegex);
          }),
          (pt.monthsShortRegex = function (e) {
            return this._monthsParseExact
              ? (d(this, '_monthsRegex') || Ee.call(this), e ? this._monthsShortStrictRegex : this._monthsShortRegex)
              : (d(this, '_monthsShortRegex') || (this._monthsShortRegex = Pe), this._monthsShortStrictRegex && e ? this._monthsShortStrictRegex : this._monthsShortRegex);
          }),
          (pt.week = function (e) {
            return Ce(e, this._week.dow, this._week.doy).week;
          }),
          (pt.firstDayOfYear = function () {
            return this._week.doy;
          }),
          (pt.firstDayOfWeek = function () {
            return this._week.dow;
          }),
          (pt.weekdays = function (e, a) {
            var t = s(this._weekdays) ? this._weekdays : this._weekdays[e && !0 !== e && this._weekdays.isFormat.test(a) ? 'format' : 'standalone'];
            return !0 === e ? Ue(t, this._week.dow) : e ? t[e.day()] : t;
          }),
          (pt.weekdaysMin = function (e) {
            return !0 === e ? Ue(this._weekdaysMin, this._week.dow) : e ? this._weekdaysMin[e.day()] : this._weekdaysMin;
          }),
          (pt.weekdaysShort = function (e) {
            return !0 === e ? Ue(this._weekdaysShort, this._week.dow) : e ? this._weekdaysShort[e.day()] : this._weekdaysShort;
          }),
          (pt.weekdaysParse = function (e, a, t) {
            var s, n, d;
            if (this._weekdaysParseExact)
              return function (e, a, t) {
                var s,
                  n,
                  d,
                  r = e.toLocaleLowerCase();
                if (!this._weekdaysParse)
                  for (this._weekdaysParse = [], this._shortWeekdaysParse = [], this._minWeekdaysParse = [], s = 0; s < 7; ++s)
                    (d = l([2e3, 1]).day(s)), (this._minWeekdaysParse[s] = this.weekdaysMin(d, '').toLocaleLowerCase()), (this._shortWeekdaysParse[s] = this.weekdaysShort(d, '').toLocaleLowerCase()), (this._weekdaysParse[s] = this.weekdays(d, '').toLocaleLowerCase());
                return t
                  ? 'dddd' === a
                    ? -1 !== (n = ye.call(this._weekdaysParse, r))
                      ? n
                      : null
                    : 'ddd' === a
                    ? -1 !== (n = ye.call(this._shortWeekdaysParse, r))
                      ? n
                      : null
                    : -1 !== (n = ye.call(this._minWeekdaysParse, r))
                    ? n
                    : null
                  : 'dddd' === a
                  ? -1 !== (n = ye.call(this._weekdaysParse, r)) || -1 !== (n = ye.call(this._shortWeekdaysParse, r)) || -1 !== (n = ye.call(this._minWeekdaysParse, r))
                    ? n
                    : null
                  : 'ddd' === a
                  ? -1 !== (n = ye.call(this._shortWeekdaysParse, r)) || -1 !== (n = ye.call(this._weekdaysParse, r)) || -1 !== (n = ye.call(this._minWeekdaysParse, r))
                    ? n
                    : null
                  : -1 !== (n = ye.call(this._minWeekdaysParse, r)) || -1 !== (n = ye.call(this._weekdaysParse, r)) || -1 !== (n = ye.call(this._shortWeekdaysParse, r))
                  ? n
                  : null;
              }.call(this, e, a, t);
            for (this._weekdaysParse || ((this._weekdaysParse = []), (this._minWeekdaysParse = []), (this._shortWeekdaysParse = []), (this._fullWeekdaysParse = [])), s = 0; s < 7; s++) {
              if (
                ((n = l([2e3, 1]).day(s)),
                t &&
                  !this._fullWeekdaysParse[s] &&
                  ((this._fullWeekdaysParse[s] = new RegExp('^' + this.weekdays(n, '').replace('.', '\\.?') + '$', 'i')),
                  (this._shortWeekdaysParse[s] = new RegExp('^' + this.weekdaysShort(n, '').replace('.', '\\.?') + '$', 'i')),
                  (this._minWeekdaysParse[s] = new RegExp('^' + this.weekdaysMin(n, '').replace('.', '\\.?') + '$', 'i'))),
                this._weekdaysParse[s] || ((d = '^' + this.weekdays(n, '') + '|^' + this.weekdaysShort(n, '') + '|^' + this.weekdaysMin(n, '')), (this._weekdaysParse[s] = new RegExp(d.replace('.', ''), 'i'))),
                t && 'dddd' === a && this._fullWeekdaysParse[s].test(e))
              )
                return s;
              if (t && 'ddd' === a && this._shortWeekdaysParse[s].test(e)) return s;
              if (t && 'dd' === a && this._minWeekdaysParse[s].test(e)) return s;
              if (!t && this._weekdaysParse[s].test(e)) return s;
            }
          }),
          (pt.weekdaysRegex = function (e) {
            return this._weekdaysParseExact ? (d(this, '_weekdaysRegex') || $e.call(this), e ? this._weekdaysStrictRegex : this._weekdaysRegex) : (d(this, '_weekdaysRegex') || (this._weekdaysRegex = Ke), this._weekdaysStrictRegex && e ? this._weekdaysStrictRegex : this._weekdaysRegex);
          }),
          (pt.weekdaysShortRegex = function (e) {
            return this._weekdaysParseExact
              ? (d(this, '_weekdaysRegex') || $e.call(this), e ? this._weekdaysShortStrictRegex : this._weekdaysShortRegex)
              : (d(this, '_weekdaysShortRegex') || (this._weekdaysShortRegex = qe), this._weekdaysShortStrictRegex && e ? this._weekdaysShortStrictRegex : this._weekdaysShortRegex);
          }),
          (pt.weekdaysMinRegex = function (e) {
            return this._weekdaysParseExact
              ? (d(this, '_weekdaysRegex') || $e.call(this), e ? this._weekdaysMinStrictRegex : this._weekdaysMinRegex)
              : (d(this, '_weekdaysMinRegex') || (this._weekdaysMinRegex = Ze), this._weekdaysMinStrictRegex && e ? this._weekdaysMinStrictRegex : this._weekdaysMinRegex);
          }),
          (pt.isPM = function (e) {
            return 'p' === (e + '').toLowerCase().charAt(0);
          }),
          (pt.meridiem = function (e, a, t) {
            return 11 < e ? (t ? 'pm' : 'PM') : t ? 'am' : 'AM';
          }),
          _a('en', {
            eras: [
              { since: '0001-01-01', until: 1 / 0, offset: 1, name: 'Anno Domini', narrow: 'AD', abbr: 'AD' },
              { since: '0000-12-31', until: -1 / 0, offset: 1, name: 'Before Christ', narrow: 'BC', abbr: 'BC' },
            ],
            dayOfMonthOrdinalParse: /\d{1,2}(th|st|nd|rd)/,
            ordinal: function (e) {
              var a = e % 10;
              return e + (1 === G((e % 100) / 10) ? 'th' : 1 == a ? 'st' : 2 == a ? 'nd' : 3 == a ? 'rd' : 'th');
            },
          }),
          (t.lang = D('moment.lang is deprecated. Use moment.locale instead.', _a)),
          (t.langData = D('moment.langData is deprecated. Use moment.localeData instead.', ma));
        var gt = Math.abs;
        function wt(e, a, t, s) {
          var n = Ga(a, t);
          return (e._milliseconds += s * n._milliseconds), (e._days += s * n._days), (e._months += s * n._months), e._bubble();
        }
        function bt(e) {
          return e < 0 ? Math.floor(e) : Math.ceil(e);
        }
        function vt(e) {
          return (4800 * e) / 146097;
        }
        function St(e) {
          return (146097 * e) / 4800;
        }
        function Ht(e) {
          return function () {
            return this.as(e);
          };
        }
        var jt = Ht('ms'),
          xt = Ht('s'),
          Pt = Ht('m'),
          Ot = Ht('h'),
          Wt = Ht('d'),
          At = Ht('w'),
          Et = Ht('M'),
          Ft = Ht('Q'),
          zt = Ht('y');
        function Nt(e) {
          return function () {
            return this.isValid() ? this._data[e] : NaN;
          };
        }
        var Jt = Nt('milliseconds'),
          Rt = Nt('seconds'),
          Ct = Nt('minutes'),
          It = Nt('hours'),
          Ut = Nt('days'),
          Gt = Nt('months'),
          Vt = Nt('years');
        var Bt = Math.round,
          Kt = { ss: 44, s: 45, m: 45, h: 22, d: 26, w: null, M: 11 };
        function qt(e, a, t, s) {
          var n = Ga(e).abs(),
            d = Bt(n.as('s')),
            r = Bt(n.as('m')),
            i = Bt(n.as('h')),
            u = Bt(n.as('d')),
            _ = Bt(n.as('M')),
            o = Bt(n.as('w')),
            m = Bt(n.as('y')),
            l = (d <= t.ss ? ['s', d] : d < t.s && ['ss', d]) || (r <= 1 && ['m']) || (r < t.m && ['mm', r]) || (i <= 1 && ['h']) || (i < t.h && ['hh', i]) || (u <= 1 && ['d']) || (u < t.d && ['dd', u]);
          return (
            null != t.w && (l = l || (o <= 1 && ['w']) || (o < t.w && ['ww', o])),
            ((l = l || (_ <= 1 && ['M']) || (_ < t.M && ['MM', _]) || (m <= 1 && ['y']) || ['yy', m])[2] = a),
            (l[3] = 0 < +e),
            (l[4] = s),
            function (e, a, t, s, n) {
              return n.relativeTime(a || 1, !!t, e, s);
            }.apply(null, l)
          );
        }
        var Zt = Math.abs;
        function $t(e) {
          return (0 < e) - (e < 0) || +e;
        }
        function Qt() {
          if (!this.isValid()) return this.localeData().invalidDate();
          var e,
            a,
            t,
            s,
            n,
            d,
            r,
            i,
            u = Zt(this._milliseconds) / 1e3,
            _ = Zt(this._days),
            o = Zt(this._months),
            m = this.asSeconds();
          return m
            ? ((e = U(u / 60)),
              (a = U(e / 60)),
              (u %= 60),
              (e %= 60),
              (t = U(o / 12)),
              (o %= 12),
              (s = u ? u.toFixed(3).replace(/\.?0+$/, '') : ''),
              (n = m < 0 ? '-' : ''),
              (d = $t(this._months) !== $t(m) ? '-' : ''),
              (r = $t(this._days) !== $t(m) ? '-' : ''),
              (i = $t(this._milliseconds) !== $t(m) ? '-' : ''),
              n + 'P' + (t ? d + t + 'Y' : '') + (o ? d + o + 'M' : '') + (_ ? r + _ + 'D' : '') + (a || e || u ? 'T' : '') + (a ? i + a + 'H' : '') + (e ? i + e + 'M' : '') + (u ? i + s + 'S' : ''))
            : 'P0D';
        }
        var Xt = Wa.prototype;
        (Xt.isValid = function () {
          return this._isValid;
        }),
          (Xt.abs = function () {
            var e = this._data;
            return (
              (this._milliseconds = gt(this._milliseconds)),
              (this._days = gt(this._days)),
              (this._months = gt(this._months)),
              (e.milliseconds = gt(e.milliseconds)),
              (e.seconds = gt(e.seconds)),
              (e.minutes = gt(e.minutes)),
              (e.hours = gt(e.hours)),
              (e.months = gt(e.months)),
              (e.years = gt(e.years)),
              this
            );
          }),
          (Xt.add = function (e, a) {
            return wt(this, e, a, 1);
          }),
          (Xt.subtract = function (e, a) {
            return wt(this, e, a, -1);
          }),
          (Xt.as = function (e) {
            if (!this.isValid()) return NaN;
            var a,
              t,
              s = this._milliseconds;
            if ('month' === (e = N(e)) || 'quarter' === e || 'year' === e)
              switch (((a = this._days + s / 864e5), (t = this._months + vt(a)), e)) {
                case 'month':
                  return t;
                case 'quarter':
                  return t / 3;
                case 'year':
                  return t / 12;
              }
            else
              switch (((a = this._days + Math.round(St(this._months))), e)) {
                case 'week':
                  return a / 7 + s / 6048e5;
                case 'day':
                  return a + s / 864e5;
                case 'hour':
                  return 24 * a + s / 36e5;
                case 'minute':
                  return 1440 * a + s / 6e4;
                case 'second':
                  return 86400 * a + s / 1e3;
                case 'millisecond':
                  return Math.floor(864e5 * a) + s;
                default:
                  throw new Error('Unknown unit ' + e);
              }
          }),
          (Xt.asMilliseconds = jt),
          (Xt.asSeconds = xt),
          (Xt.asMinutes = Pt),
          (Xt.asHours = Ot),
          (Xt.asDays = Wt),
          (Xt.asWeeks = At),
          (Xt.asMonths = Et),
          (Xt.asQuarters = Ft),
          (Xt.asYears = zt),
          (Xt.valueOf = function () {
            return this.isValid() ? this._milliseconds + 864e5 * this._days + (this._months % 12) * 2592e6 + 31536e6 * G(this._months / 12) : NaN;
          }),
          (Xt._bubble = function () {
            var e,
              a,
              t,
              s,
              n,
              d = this._milliseconds,
              r = this._days,
              i = this._months,
              u = this._data;
            return (
              (0 <= d && 0 <= r && 0 <= i) || (d <= 0 && r <= 0 && i <= 0) || ((d += 864e5 * bt(St(i) + r)), (i = r = 0)),
              (u.milliseconds = d % 1e3),
              (e = U(d / 1e3)),
              (u.seconds = e % 60),
              (a = U(e / 60)),
              (u.minutes = a % 60),
              (t = U(a / 60)),
              (u.hours = t % 24),
              (r += U(t / 24)),
              (i += n = U(vt(r))),
              (r -= bt(St(n))),
              (s = U(i / 12)),
              (i %= 12),
              (u.days = r),
              (u.months = i),
              (u.years = s),
              this
            );
          }),
          (Xt.clone = function () {
            return Ga(this);
          }),
          (Xt.get = function (e) {
            return (e = N(e)), this.isValid() ? this[e + 's']() : NaN;
          }),
          (Xt.milliseconds = Jt),
          (Xt.seconds = Rt),
          (Xt.minutes = Ct),
          (Xt.hours = It),
          (Xt.days = Ut),
          (Xt.weeks = function () {
            return U(this.days() / 7);
          }),
          (Xt.months = Gt),
          (Xt.years = Vt),
          (Xt.humanize = function (e, a) {
            if (!this.isValid()) return this.localeData().invalidDate();
            var t,
              s,
              n = !1,
              d = Kt;
            return (
              'object' == typeof e && ((a = e), (e = !1)),
              'boolean' == typeof e && (n = e),
              'object' == typeof a && ((d = Object.assign({}, Kt, a)), null != a.s && null == a.ss && (d.ss = a.s - 1)),
              (t = this.localeData()),
              (s = qt(this, !n, d, t)),
              n && (s = t.pastFuture(+this, s)),
              t.postformat(s)
            );
          }),
          (Xt.toISOString = Qt),
          (Xt.toString = Qt),
          (Xt.toJSON = Qt),
          (Xt.locale = at),
          (Xt.localeData = st),
          (Xt.toIsoString = D('toIsoString() is deprecated. Please use toISOString() instead (notice the capitals)', Qt)),
          (Xt.lang = tt),
          W('X', 0, 0, 'unix'),
          W('x', 0, 0, 'valueOf'),
          le('x', ue),
          le('X', /[+-]?\d+(\.\d{1,3})?/),
          Le('X', function (e, a, t) {
            t._d = new Date(1e3 * parseFloat(e));
          }),
          Le('x', function (e, a, t) {
            t._d = new Date(G(e));
          }),
          (t.version = '2.29.1'),
          (e = Ha),
          (t.fn = yt),
          (t.min = function () {
            return Pa('isBefore', [].slice.call(arguments, 0));
          }),
          (t.max = function () {
            return Pa('isAfter', [].slice.call(arguments, 0));
          }),
          (t.now = function () {
            return Date.now ? Date.now() : +new Date();
          }),
          (t.utc = l),
          (t.unix = function (e) {
            return Ha(1e3 * e);
          }),
          (t.months = function (e, a) {
            return Dt(e, a, 'months');
          }),
          (t.isDate = _),
          (t.locale = _a),
          (t.invalid = c),
          (t.duration = Ga),
          (t.isMoment = p),
          (t.weekdays = function (e, a, t) {
            return Tt(e, a, t, 'weekdays');
          }),
          (t.parseZone = function () {
            return Ha.apply(null, arguments).parseZone();
          }),
          (t.localeData = ma),
          (t.isDuration = Aa),
          (t.monthsShort = function (e, a) {
            return Dt(e, a, 'monthsShort');
          }),
          (t.weekdaysMin = function (e, a, t) {
            return Tt(e, a, t, 'weekdaysMin');
          }),
          (t.defineLocale = oa),
          (t.updateLocale = function (e, a) {
            var t, s, n;
            return (
              null != a
                ? ((n = sa), null != na[e] && null != na[e].parentLocale ? na[e].set(v(na[e]._config, a)) : (null != (s = ua(e)) && (n = s._config), (a = v(n, a)), null == s && (a.abbr = e), ((t = new S(a)).parentLocale = na[e]), (na[e] = t)), _a(e))
                : null != na[e] && (null != na[e].parentLocale ? ((na[e] = na[e].parentLocale), e === _a() && _a(e)) : null != na[e] && delete na[e]),
              na[e]
            );
          }),
          (t.locales = function () {
            return T(na);
          }),
          (t.weekdaysShort = function (e, a, t) {
            return Tt(e, a, t, 'weekdaysShort');
          }),
          (t.normalizeUnits = N),
          (t.relativeTimeRounding = function (e) {
            return void 0 === e ? Bt : 'function' == typeof e && ((Bt = e), !0);
          }),
          (t.relativeTimeThreshold = function (e, a) {
            return void 0 !== Kt[e] && (void 0 === a ? Kt[e] : ((Kt[e] = a), 's' === e && (Kt.ss = a - 1), !0));
          }),
          (t.calendarFormat = function (e, a) {
            var t = e.diff(a, 'days', !0);
            return t < -6 ? 'sameElse' : t < -1 ? 'lastWeek' : t < 0 ? 'lastDay' : t < 1 ? 'sameDay' : t < 2 ? 'nextDay' : t < 7 ? 'nextWeek' : 'sameElse';
          }),
          (t.prototype = yt),
          (t.HTML5_FMT = { DATETIME_LOCAL: 'YYYY-MM-DDTHH:mm', DATETIME_LOCAL_SECONDS: 'YYYY-MM-DDTHH:mm:ss', DATETIME_LOCAL_MS: 'YYYY-MM-DDTHH:mm:ss.SSS', DATE: 'YYYY-MM-DD', TIME: 'HH:mm', TIME_SECONDS: 'HH:mm:ss', TIME_MS: 'HH:mm:ss.SSS', WEEK: 'GGGG-[W]WW', MONTH: 'YYYY-MM' }),
          t.defineLocale('af', {
            months: 'Januarie_Februarie_Maart_April_Mei_Junie_Julie_Augustus_September_Oktober_November_Desember'.split('_'),
            monthsShort: 'Jan_Feb_Mrt_Apr_Mei_Jun_Jul_Aug_Sep_Okt_Nov_Des'.split('_'),
            weekdays: 'Sondag_Maandag_Dinsdag_Woensdag_Donderdag_Vrydag_Saterdag'.split('_'),
            weekdaysShort: 'Son_Maa_Din_Woe_Don_Vry_Sat'.split('_'),
            weekdaysMin: 'So_Ma_Di_Wo_Do_Vr_Sa'.split('_'),
            meridiemParse: /vm|nm/i,
            isPM: function (e) {
              return /^nm$/i.test(e);
            },
            meridiem: function (e, a, t) {
              return e < 12 ? (t ? 'vm' : 'VM') : t ? 'nm' : 'NM';
            },
            longDateFormat: { LT: 'HH:mm', LTS: 'HH:mm:ss', L: 'DD/MM/YYYY', LL: 'D MMMM YYYY', LLL: 'D MMMM YYYY HH:mm', LLLL: 'dddd, D MMMM YYYY HH:mm' },
            calendar: { sameDay: '[Vandag om] LT', nextDay: '[Môre om] LT', nextWeek: 'dddd [om] LT', lastDay: '[Gister om] LT', lastWeek: '[Laas] dddd [om] LT', sameElse: 'L' },
            relativeTime: { future: 'oor %s', past: '%s gelede', s: "'n paar sekondes", ss: '%d sekondes', m: "'n minuut", mm: '%d minute', h: "'n uur", hh: '%d ure', d: "'n dag", dd: '%d dae', M: "'n maand", MM: '%d maande', y: "'n jaar", yy: '%d jaar' },
            dayOfMonthOrdinalParse: /\d{1,2}(ste|de)/,
            ordinal: function (e) {
              return e + (1 === e || 8 === e || 20 <= e ? 'ste' : 'de');
            },
            week: { dow: 1, doy: 4 },
          });
        function es(e) {
          return 0 === e ? 0 : 1 === e ? 1 : 2 === e ? 2 : 3 <= e % 100 && e % 100 <= 10 ? 3 : 11 <= e % 100 ? 4 : 5;
        }
        function as(e) {
          return function (a, t, s, n) {
            var d = es(a),
              r = ts[e][es(a)];
            return 2 === d && (r = r[t ? 0 : 1]), r.replace(/%d/i, a);
          };
        }
        var ts = {
            s: ['أقل من ثانية', 'ثانية واحدة', ['ثانيتان', 'ثانيتين'], '%d ثوان', '%d ثانية', '%d ثانية'],
            m: ['أقل من دقيقة', 'دقيقة واحدة', ['دقيقتان', 'دقيقتين'], '%d دقائق', '%d دقيقة', '%d دقيقة'],
            h: ['أقل من ساعة', 'ساعة واحدة', ['ساعتان', 'ساعتين'], '%d ساعات', '%d ساعة', '%d ساعة'],
            d: ['أقل من يوم', 'يوم واحد', ['يومان', 'يومين'], '%d أيام', '%d يومًا', '%d يوم'],
            M: ['أقل من شهر', 'شهر واحد', ['شهران', 'شهرين'], '%d أشهر', '%d شهرا', '%d شهر'],
            y: ['أقل من عام', 'عام واحد', ['عامان', 'عامين'], '%d أعوام', '%d عامًا', '%d عام'],
          },
          ss = ['جانفي', 'فيفري', 'مارس', 'أفريل', 'ماي', 'جوان', 'جويلية', 'أوت', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
        t.defineLocale('ar-dz', {
          months: ss,
          monthsShort: ss,
          weekdays: 'الأحد_الإثنين_الثلاثاء_الأربعاء_الخميس_الجمعة_السبت'.split('_'),
          weekdaysShort: 'أحد_إثنين_ثلاثاء_أربعاء_خميس_جمعة_سبت'.split('_'),
          weekdaysMin: 'ح_ن_ث_ر_خ_ج_س'.split('_'),
          weekdaysParseExact: !0,
          longDateFormat: { LT: 'HH:mm', LTS: 'HH:mm:ss', L: 'D/‏M/‏YYYY', LL: 'D MMMM YYYY', LLL: 'D MMMM YYYY HH:mm', LLLL: 'dddd D MMMM YYYY HH:mm' },
          meridiemParse: /\u0635|\u0645/,
          isPM: function (e) {
            return 'م' === e;
          },
          meridiem: function (e, a, t) {
            return e < 12 ? 'ص' : 'م';
          },
          calendar: { sameDay: '[اليوم عند الساعة] LT', nextDay: '[غدًا عند الساعة] LT', nextWeek: 'dddd [عند الساعة] LT', lastDay: '[أمس عند الساعة] LT', lastWeek: 'dddd [عند الساعة] LT', sameElse: 'L' },
          relativeTime: { future: 'بعد %s', past: 'منذ %s', s: as('s'), ss: as('s'), m: as('m'), mm: as('m'), h: as('h'), hh: as('h'), d: as('d'), dd: as('d'), M: as('M'), MM: as('M'), y: as('y'), yy: as('y') },
          postformat: function (e) {
            return e.replace(/,/g, '،');
          },
          week: { dow: 0, doy: 4 },
        }),
          t.defineLocale('ar-kw', {
            months: 'يناير_فبراير_مارس_أبريل_ماي_يونيو_يوليوز_غشت_شتنبر_أكتوبر_نونبر_دجنبر'.split('_'),
            monthsShort: 'يناير_فبراير_مارس_أبريل_ماي_يونيو_يوليوز_غشت_شتنبر_أكتوبر_نونبر_دجنبر'.split('_'),
            weekdays: 'الأحد_الإتنين_الثلاثاء_الأربعاء_الخميس_الجمعة_السبت'.split('_'),
            weekdaysShort: 'احد_اتنين_ثلاثاء_اربعاء_خميس_جمعة_سبت'.split('_'),
            weekdaysMin: 'ح_ن_ث_ر_خ_ج_س'.split('_'),
            weekdaysParseExact: !0,
            longDateFormat: { LT: 'HH:mm', LTS: 'HH:mm:ss', L: 'DD/MM/YYYY', LL: 'D MMMM YYYY', LLL: 'D MMMM YYYY HH:mm', LLLL: 'dddd D MMMM YYYY HH:mm' },
            calendar: { sameDay: '[اليوم على الساعة] LT', nextDay: '[غدا على الساعة] LT', nextWeek: 'dddd [على الساعة] LT', lastDay: '[أمس على الساعة] LT', lastWeek: 'dddd [على الساعة] LT', sameElse: 'L' },
            relativeTime: { future: 'في %s', past: 'منذ %s', s: 'ثوان', ss: '%d ثانية', m: 'دقيقة', mm: '%d دقائق', h: 'ساعة', hh: '%d ساعات', d: 'يوم', dd: '%d أيام', M: 'شهر', MM: '%d أشهر', y: 'سنة', yy: '%d سنوات' },
            week: { dow: 0, doy: 12 },
          });
        function ns(e) {
          return 0 === e ? 0 : 1 === e ? 1 : 2 === e ? 2 : 3 <= e % 100 && e % 100 <= 10 ? 3 : 11 <= e % 100 ? 4 : 5;
        }
        function ds(e) {
          return function (a, t, s, n) {
            var d = ns(a),
              r = is[e][ns(a)];
            return 2 === d && (r = r[t ? 0 : 1]), r.replace(/%d/i, a);
          };
        }
        var rs = { 1: '1', 2: '2', 3: '3', 4: '4', 5: '5', 6: '6', 7: '7', 8: '8', 9: '9', 0: '0' },
          is = {
            s: ['أقل من ثانية', 'ثانية واحدة', ['ثانيتان', 'ثانيتين'], '%d ثوان', '%d ثانية', '%d ثانية'],
            m: ['أقل من دقيقة', 'دقيقة واحدة', ['دقيقتان', 'دقيقتين'], '%d دقائق', '%d دقيقة', '%d دقيقة'],
            h: ['أقل من ساعة', 'ساعة واحدة', ['ساعتان', 'ساعتين'], '%d ساعات', '%d ساعة', '%d ساعة'],
            d: ['أقل من يوم', 'يوم واحد', ['يومان', 'يومين'], '%d أيام', '%d يومًا', '%d يوم'],
            M: ['أقل من شهر', 'شهر واحد', ['شهران', 'شهرين'], '%d أشهر', '%d شهرا', '%d شهر'],
            y: ['أقل من عام', 'عام واحد', ['عامان', 'عامين'], '%d أعوام', '%d عامًا', '%d عام'],
          },
          us = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
        t.defineLocale('ar-ly', {
          months: us,
          monthsShort: us,
          weekdays: 'الأحد_الإثنين_الثلاثاء_الأربعاء_الخميس_الجمعة_السبت'.split('_'),
          weekdaysShort: 'أحد_إثنين_ثلاثاء_أربعاء_خميس_جمعة_سبت'.split('_'),
          weekdaysMin: 'ح_ن_ث_ر_خ_ج_س'.split('_'),
          weekdaysParseExact: !0,
          longDateFormat: { LT: 'HH:mm', LTS: 'HH:mm:ss', L: 'D/‏M/‏YYYY', LL: 'D MMMM YYYY', LLL: 'D MMMM YYYY HH:mm', LLLL: 'dddd D MMMM YYYY HH:mm' },
          meridiemParse: /\u0635|\u0645/,
          isPM: function (e) {
            return 'م' === e;
          },
          meridiem: function (e, a, t) {
            return e < 12 ? 'ص' : 'م';
          },
          calendar: { sameDay: '[اليوم عند الساعة] LT', nextDay: '[غدًا عند الساعة] LT', nextWeek: 'dddd [عند الساعة] LT', lastDay: '[أمس عند الساعة] LT', lastWeek: 'dddd [عند الساعة] LT', sameElse: 'L' },
          relativeTime: { future: 'بعد %s', past: 'منذ %s', s: ds('s'), ss: ds('s'), m: ds('m'), mm: ds('m'), h: ds('h'), hh: ds('h'), d: ds('d'), dd: ds('d'), M: ds('M'), MM: ds('M'), y: ds('y'), yy: ds('y') },
          preparse: function (e) {
            return e.replace(/\u060c/g, ',');
          },
          postformat: function (e) {
            return e
              .replace(/\d/g, function (e) {
                return rs[e];
              })
              .replace(/,/g, '،');
          },
          week: { dow: 6, doy: 12 },
        }),
          t.defineLocale('ar-ma', {
            months: 'يناير_فبراير_مارس_أبريل_ماي_يونيو_يوليوز_غشت_شتنبر_أكتوبر_نونبر_دجنبر'.split('_'),
            monthsShort: 'يناير_فبراير_مارس_أبريل_ماي_يونيو_يوليوز_غشت_شتنبر_أكتوبر_نونبر_دجنبر'.split('_'),
            weekdays: 'الأحد_الإثنين_الثلاثاء_الأربعاء_الخميس_الجمعة_السبت'.split('_'),
            weekdaysShort: 'احد_اثنين_ثلاثاء_اربعاء_خميس_جمعة_سبت'.split('_'),
            weekdaysMin: 'ح_ن_ث_ر_خ_ج_س'.split('_'),
            weekdaysParseExact: !0,
            longDateFormat: { LT: 'HH:mm', LTS: 'HH:mm:ss', L: 'DD/MM/YYYY', LL: 'D MMMM YYYY', LLL: 'D MMMM YYYY HH:mm', LLLL: 'dddd D MMMM YYYY HH:mm' },
            calendar: { sameDay: '[اليوم على الساعة] LT', nextDay: '[غدا على الساعة] LT', nextWeek: 'dddd [على الساعة] LT', lastDay: '[أمس على الساعة] LT', lastWeek: 'dddd [على الساعة] LT', sameElse: 'L' },
            relativeTime: { future: 'في %s', past: 'منذ %s', s: 'ثوان', ss: '%d ثانية', m: 'دقيقة', mm: '%d دقائق', h: 'ساعة', hh: '%d ساعات', d: 'يوم', dd: '%d أيام', M: 'شهر', MM: '%d أشهر', y: 'سنة', yy: '%d سنوات' },
            week: { dow: 1, doy: 4 },
          });
        var _s = { 1: '١', 2: '٢', 3: '٣', 4: '٤', 5: '٥', 6: '٦', 7: '٧', 8: '٨', 9: '٩', 0: '٠' },
          os = { '١': '1', '٢': '2', '٣': '3', '٤': '4', '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9', '٠': '0' };
        t.defineLocale('ar-sa', {
          months: 'يناير_فبراير_مارس_أبريل_مايو_يونيو_يوليو_أغسطس_سبتمبر_أكتوبر_نوفمبر_ديسمبر'.split('_'),
          monthsShort: 'يناير_فبراير_مارس_أبريل_مايو_يونيو_يوليو_أغسطس_سبتمبر_أكتوبر_نوفمبر_ديسمبر'.split('_'),
          weekdays: 'الأحد_الإثنين_الثلاثاء_الأربعاء_الخميس_الجمعة_السبت'.split('_'),
          weekdaysShort: 'أحد_إثنين_ثلاثاء_أربعاء_خميس_جمعة_سبت'.split('_'),
          weekdaysMin: 'ح_ن_ث_ر_خ_ج_س'.split('_'),
          weekdaysParseExact: !0,
          longDateFormat: { LT: 'HH:mm', LTS: 'HH:mm:ss', L: 'DD/MM/YYYY', LL: 'D MMMM YYYY', LLL: 'D MMMM YYYY HH:mm', LLLL: 'dddd D MMMM YYYY HH:mm' },
          meridiemParse: /\u0635|\u0645/,
          isPM: function (e) {
            return 'م' === e;
          },
          meridiem: function (e, a, t) {
            return e < 12 ? 'ص' : 'م';
          },
          calendar: { sameDay: '[اليوم على الساعة] LT', nextDay: '[غدا على الساعة] LT', nextWeek: 'dddd [على الساعة] LT', lastDay: '[أمس على الساعة] LT', lastWeek: 'dddd [على الساعة] LT', sameElse: 'L' },
          relativeTime: { future: 'في %s', past: 'منذ %s', s: 'ثوان', ss: '%d ثانية', m: 'دقيقة', mm: '%d دقائق', h: 'ساعة', hh: '%d ساعات', d: 'يوم', dd: '%d أيام', M: 'شهر', MM: '%d أشهر', y: 'سنة', yy: '%d سنوات' },
          preparse: function (e) {
            return e
              .replace(/[\u0661\u0662\u0663\u0664\u0665\u0666\u0667\u0668\u0669\u0660]/g, function (e) {
                return os[e];
              })
              .replace(/\u060c/g, ',');
          },
          postformat: function (e) {
            return e
              .replace(/\d/g, function (e) {
                return _s[e];
              })
              .replace(/,/g, '،');
          },
          week: { dow: 0, doy: 6 },
        }),
          t.defineLocale('ar-tn', {
            months: 'جانفي_فيفري_مارس_أفريل_ماي_جوان_جويلية_أوت_سبتمبر_أكتوبر_نوفمبر_ديسمبر'.split('_'),
            monthsShort: 'جانفي_فيفري_مارس_أفريل_ماي_جوان_جويلية_أوت_سبتمبر_أكتوبر_نوفمبر_ديسمبر'.split('_'),
            weekdays: 'الأحد_الإثنين_الثلاثاء_الأربعاء_الخميس_الجمعة_السبت'.split('_'),
            weekdaysShort: 'أحد_إثنين_ثلاثاء_أربعاء_خميس_جمعة_سبت'.split('_'),
            weekdaysMin: 'ح_ن_ث_ر_خ_ج_س'.split('_'),
            weekdaysParseExact: !0,
            longDateFormat: { LT: 'HH:mm', LTS: 'HH:mm:ss', L: 'DD/MM/YYYY', LL: 'D MMMM YYYY', LLL: 'D MMMM YYYY HH:mm', LLLL: 'dddd D MMMM YYYY HH:mm' },
            calendar: { sameDay: '[اليوم على الساعة] LT', nextDay: '[غدا على الساعة] LT', nextWeek: 'dddd [على الساعة] LT', lastDay: '[أمس على الساعة] LT', lastWeek: 'dddd [على الساعة] LT', sameElse: 'L' },
            relativeTime: { future: 'في %s', past: 'منذ %s', s: 'ثوان', ss: '%d ثانية', m: 'دقيقة', mm: '%d دقائق', h: 'ساعة', hh: '%d ساعات', d: 'يوم', dd: '%d أيام', M: 'شهر', MM: '%d أشهر', y: 'سنة', yy: '%d سنوات' },
            week: { dow: 1, doy: 4 },
          });
        function ms(e) {
          return 0 === e ? 0 : 1 === e ? 1 : 2 === e ? 2 : 3 <= e % 100 && e % 100 <= 10 ? 3 : 11 <= e % 100 ? 4 : 5;
        }
        function ls(e) {
          return function (a, t, s, n) {
            var d = ms(a),
              r = cs[e][ms(a)];
            return 2 === d && (r = r[t ? 0 : 1]), r.replace(/%d/i, a);
          };
        }
        var Ms = { 1: '١', 2: '٢', 3: '٣', 4: '٤', 5: '٥', 6: '٦', 7: '٧', 8: '٨', 9: '٩', 0: '٠' },
          hs = { '١': '1', '٢': '2', '٣': '3', '٤': '4', '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9', '٠': '0' },
          cs = {
            s: ['أقل من ثانية', 'ثانية واحدة', ['ثانيتان', 'ثانيتين'], '%d ثوان', '%d ثانية', '%d ثانية'],
            m: ['أقل من دقيقة', 'دقيقة واحدة', ['دقيقتان', 'دقيقتين'], '%d دقائق', '%d دقيقة', '%d دقيقة'],
            h: ['أقل من ساعة', 'ساعة واحدة', ['ساعتان', 'ساعتين'], '%d ساعات', '%d ساعة', '%d ساعة'],
            d: ['أقل من يوم', 'يوم واحد', ['يومان', 'يومين'], '%d أيام', '%d يومًا', '%d يوم'],
            M: ['أقل من شهر', 'شهر واحد', ['شهران', 'شهرين'], '%d أشهر', '%d شهرا', '%d شهر'],
            y: ['أقل من عام', 'عام واحد', ['عامان', 'عامين'], '%d أعوام', '%d عامًا', '%d عام'],
          },
          Ls = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
        t.defineLocale('ar', {
          months: Ls,
          monthsShort: Ls,
          weekdays: 'الأحد_الإثنين_الثلاثاء_الأربعاء_الخميس_الجمعة_السبت'.split('_'),
          weekdaysShort: 'أحد_إثنين_ثلاثاء_أربعاء_خميس_جمعة_سبت'.split('_'),
          weekdaysMin: 'ح_ن_ث_ر_خ_ج_س'.split('_'),
          weekdaysParseExact: !0,
          longDateFormat: { LT: 'HH:mm', LTS: 'HH:mm:ss', L: 'D/‏M/‏YYYY', LL: 'D MMMM YYYY', LLL: 'D MMMM YYYY HH:mm', LLLL: 'dddd D MMMM YYYY HH:mm' },
          meridiemParse: /\u0635|\u0645/,
          isPM: function (e) {
            return 'م' === e;
          },
          meridiem: function (e, a, t) {
            return e < 12 ? 'ص' : 'م';
          },
          calendar: { sameDay: '[اليوم عند الساعة] LT', nextDay: '[غدًا عند الساعة] LT', nextWeek: 'dddd [عند الساعة] LT', lastDay: '[أمس عند الساعة] LT', lastWeek: 'dddd [عند الساعة] LT', sameElse: 'L' },
          relativeTime: { future: 'بعد %s', past: 'منذ %s', s: ls('s'), ss: ls('s'), m: ls('m'), mm: ls('m'), h: ls('h'), hh: ls('h'), d: ls('d'), dd: ls('d'), M: ls('M'), MM: ls('M'), y: ls('y'), yy: ls('y') },
          preparse: function (e) {
            return e
              .replace(/[\u0661\u0662\u0663\u0664\u0665\u0666\u0667\u0668\u0669\u0660]/g, function (e) {
                return hs[e];
              })
              .replace(/\u060c/g, ',');
          },
          postformat: function (e) {
            return e
              .replace(/\d/g, function (e) {
                return Ms[e];
              })
              .replace(/,/g, '،');
          },
          week: { dow: 6, doy: 12 },
        });
        var Ys = { 1: '-inci', 5: '-inci', 8: '-inci', 70: '-inci', 80: '-inci', 2: '-nci', 7: '-nci', 20: '-nci', 50: '-nci', 3: '-üncü', 4: '-üncü', 100: '-üncü', 6: '-ncı', 9: '-uncu', 10: '-uncu', 30: '-uncu', 60: '-ıncı', 90: '-ıncı' };
        function ys(e, a, t) {
          var s, n;
          return 'm' === t
            ? a
              ? 'хвіліна'
              : 'хвіліну'
            : 'h' === t
            ? a
              ? 'гадзіна'
              : 'гадзіну'
            : e +
              ' ' +
              ((s = +e),
              (n = { ss: a ? 'секунда_секунды_секунд' : 'секунду_секунды_секунд', mm: a ? 'хвіліна_хвіліны_хвілін' : 'хвіліну_хвіліны_хвілін', hh: a ? 'гадзіна_гадзіны_гадзін' : 'гадзіну_гадзіны_гадзін', dd: 'дзень_дні_дзён', MM: 'месяц_месяцы_месяцаў', yy: 'год_гады_гадоў' }[t].split('_')),
              s % 10 == 1 && s % 100 != 11 ? n[0] : 2 <= s % 10 && s % 10 <= 4 && (s % 100 < 10 || 20 <= s % 100) ? n[1] : n[2]);
        }
        t.defineLocale('az', {
          months: 'yanvar_fevral_mart_aprel_may_iyun_iyul_avqust_sentyabr_oktyabr_noyabr_dekabr'.split('_'),
          monthsShort: 'yan_fev_mar_apr_may_iyn_iyl_avq_sen_okt_noy_dek'.split('_'),
          weekdays: 'Bazar_Bazar ertəsi_Çərşənbə axşamı_Çərşənbə_Cümə axşamı_Cümə_Şənbə'.split('_'),
          weekdaysShort: 'Baz_BzE_ÇAx_Çər_CAx_Cüm_Şən'.split('_'),
          weekdaysMin: 'Bz_BE_ÇA_Çə_CA_Cü_Şə'.split('_'),
          weekdaysParseExact: !0,
          longDateFormat: { LT: 'HH:mm', LTS: 'HH:mm:ss', L: 'DD.MM.YYYY', LL: 'D MMMM YYYY', LLL: 'D MMMM YYYY HH:mm', LLLL: 'dddd, D MMMM YYYY HH:mm' },
          calendar: { sameDay: '[bugün saat] LT', nextDay: '[sabah saat] LT', nextWeek: '[gələn həftə] dddd [saat] LT', lastDay: '[dünən] LT', lastWeek: '[keçən həftə] dddd [saat] LT', sameElse: 'L' },
          relativeTime: { future: '%s sonra', past: '%s əvvəl', s: 'bir neçə saniyə', ss: '%d saniyə', m: 'bir dəqiqə', mm: '%d dəqiqə', h: 'bir saat', hh: '%d saat', d: 'bir gün', dd: '%d gün', M: 'bir ay', MM: '%d ay', y: 'bir il', yy: '%d il' },
          meridiemParse: /gec\u0259|s\u0259h\u0259r|g\xfcnd\xfcz|ax\u015fam/,
          isPM: function (e) {
            return /^(g\xfcnd\xfcz|ax\u015fam)$/.test(e);
          },
          meridiem: function (e, a, t) {
            return e < 4 ? 'gecə' : e < 12 ? 'səhər' : e < 17 ? 'gündüz' : 'axşam';
          },
          dayOfMonthOrdinalParse: /\d{1,2}-(\u0131nc\u0131|inci|nci|\xfcnc\xfc|nc\u0131|uncu)/,
          ordinal: function (e) {
            if (0 === e) return e + '-ıncı';
            var a = e % 10;
            return e + (Ys[a] || Ys[(e % 100) - a] || Ys[100 <= e ? 100 : null]);
          },
          week: { dow: 1, doy: 7 },
        }),
          t.defineLocale('be', {
            months: { format: 'студзеня_лютага_сакавіка_красавіка_траўня_чэрвеня_ліпеня_жніўня_верасня_кастрычніка_лістапада_снежня'.split('_'), standalone: 'студзень_люты_сакавік_красавік_травень_чэрвень_ліпень_жнівень_верасень_кастрычнік_лістапад_снежань'.split('_') },
            monthsShort: 'студ_лют_сак_крас_трав_чэрв_ліп_жнів_вер_каст_ліст_снеж'.split('_'),
            weekdays: {
              format: 'нядзелю_панядзелак_аўторак_сераду_чацвер_пятніцу_суботу'.split('_'),
              standalone: 'нядзеля_панядзелак_аўторак_серада_чацвер_пятніца_субота'.split('_'),
              isFormat: /\[ ?[\u0423\u0443\u045e] ?(?:\u043c\u0456\u043d\u0443\u043b\u0443\u044e|\u043d\u0430\u0441\u0442\u0443\u043f\u043d\u0443\u044e)? ?\] ?dddd/,
            },
            weekdaysShort: 'нд_пн_ат_ср_чц_пт_сб'.split('_'),
            weekdaysMin: 'нд_пн_ат_ср_чц_пт_сб'.split('_'),
            longDateFormat: { LT: 'HH:mm', LTS: 'HH:mm:ss', L: 'DD.MM.YYYY', LL: 'D MMMM YYYY г.', LLL: 'D MMMM YYYY г., HH:mm', LLLL: 'dddd, D MMMM YYYY г., HH:mm' },
            calendar: {
              sameDay: '[Сёння ў] LT',
              nextDay: '[Заўтра ў] LT',
              lastDay: '[Учора ў] LT',
              nextWeek: function () {
                return '[У] dddd [ў] LT';
              },
              lastWeek: function () {
                switch (this.day()) {
                  case 0:
                  case 3:
                  case 5:
                  case 6:
                    return '[У мінулую] dddd [ў] LT';
                  case 1:
                  case 2:
                  case 4:
                    return '[У мінулы] dddd [ў] LT';
                }
              },
              sameElse: 'L',
            },
            relativeTime: { future: 'праз %s', past: '%s таму', s: 'некалькі секунд', m: ys, mm: ys, h: ys, hh: ys, d: 'дзень', dd: ys, M: 'месяц', MM: ys, y: 'год', yy: ys },
            meridiemParse: /\u043d\u043e\u0447\u044b|\u0440\u0430\u043d\u0456\u0446\u044b|\u0434\u043d\u044f|\u0432\u0435\u0447\u0430\u0440\u0430/,
            isPM: function (e) {
              return /^(\u0434\u043d\u044f|\u0432\u0435\u0447\u0430\u0440\u0430)$/.test(e);
            },
            meridiem: function (e, a, t) {
              return e < 4 ? 'ночы' : e < 12 ? 'раніцы' : e < 17 ? 'дня' : 'вечара';
            },
            dayOfMonthOrdinalParse: /\d{1,2}-(\u0456|\u044b|\u0433\u0430)/,
            ordinal: function (e, a) {
              switch (a) {
                case 'M':
                case 'd':
                case 'DDD':
                case 'w':
                case 'W':
                  return (e % 10 != 2 && e % 10 != 3) || e % 100 == 12 || e % 100 == 13 ? e + '-ы' : e + '-і';
                case 'D':
                  return e + '-га';
                default:
                  return e;
              }
            },
            week: { dow: 1, doy: 7 },
          }),
          t.defineLocale('bg', {
            months: 'януари_февруари_март_април_май_юни_юли_август_септември_октомври_ноември_декември'.split('_'),
            monthsShort: 'яну_фев_мар_апр_май_юни_юли_авг_сеп_окт_ное_дек'.split('_'),
            weekdays: 'неделя_понеделник_вторник_сряда_четвъртък_петък_събота'.split('_'),
            weekdaysShort: 'нед_пон_вто_сря_чет_пет_съб'.split('_'),
            weekdaysMin: 'нд_пн_вт_ср_чт_пт_сб'.split('_'),
            longDateFormat: { LT: 'H:mm', LTS: 'H:mm:ss', L: 'D.MM.YYYY', LL: 'D MMMM YYYY', LLL: 'D MMMM YYYY H:mm', LLLL: 'dddd, D MMMM YYYY H:mm' },
            calendar: {
              sameDay: '[Днес в] LT',
              nextDay: '[Утре в] LT',
              nextWeek: 'dddd [в] LT',
              lastDay: '[Вчера в] LT',
              lastWeek: function () {
                switch (this.day()) {
                  case 0:
                  case 3:
                  case 6:
                    return '[Миналата] dddd [в] LT';
                  case 1:
                  case 2:
                  case 4:
                  case 5:
                    return '[Миналия] dddd [в] LT';
                }
              },
              sameElse: 'L',
            },
            relativeTime: { future: 'след %s', past: 'преди %s', s: 'няколко секунди', ss: '%d секунди', m: 'минута', mm: '%d минути', h: 'час', hh: '%d часа', d: 'ден', dd: '%d дена', w: 'седмица', ww: '%d седмици', M: 'месец', MM: '%d месеца', y: 'година', yy: '%d години' },
            dayOfMonthOrdinalParse: /\d{1,2}-(\u0435\u0432|\u0435\u043d|\u0442\u0438|\u0432\u0438|\u0440\u0438|\u043c\u0438)/,
            ordinal: function (e) {
              var a = e % 10,
                t = e % 100;
              return 0 === e ? e + '-ев' : 0 == t ? e + '-ен' : 10 < t && t < 20 ? e + '-ти' : 1 == a ? e + '-ви' : 2 == a ? e + '-ри' : 7 == a || 8 == a ? e + '-ми' : e + '-ти';
            },
            week: { dow: 1, doy: 7 },
          }),
          t.defineLocale('bm', {
            months: 'Zanwuyekalo_Fewuruyekalo_Marisikalo_Awirilikalo_Mɛkalo_Zuwɛnkalo_Zuluyekalo_Utikalo_Sɛtanburukalo_ɔkutɔburukalo_Nowanburukalo_Desanburukalo'.split('_'),
            monthsShort: 'Zan_Few_Mar_Awi_Mɛ_Zuw_Zul_Uti_Sɛt_ɔku_Now_Des'.split('_'),
            weekdays: 'Kari_Ntɛnɛn_Tarata_Araba_Alamisa_Juma_Sibiri'.split('_'),
            weekdaysShort: 'Kar_Ntɛ_Tar_Ara_Ala_Jum_Sib'.split('_'),
            weekdaysMin: 'Ka_Nt_Ta_Ar_Al_Ju_Si'.split('_'),
            longDateFormat: { LT: 'HH:mm', LTS: 'HH:mm:ss', L: 'DD/MM/YYYY', LL: 'MMMM [tile] D [san] YYYY', LLL: 'MMMM [tile] D [san] YYYY [lɛrɛ] HH:mm', LLLL: 'dddd MMMM [tile] D [san] YYYY [lɛrɛ] HH:mm' },
            calendar: { sameDay: '[Bi lɛrɛ] LT', nextDay: '[Sini lɛrɛ] LT', nextWeek: 'dddd [don lɛrɛ] LT', lastDay: '[Kunu lɛrɛ] LT', lastWeek: 'dddd [tɛmɛnen lɛrɛ] LT', sameElse: 'L' },
            relativeTime: { future: '%s kɔnɔ', past: 'a bɛ %s bɔ', s: 'sanga dama dama', ss: 'sekondi %d', m: 'miniti kelen', mm: 'miniti %d', h: 'lɛrɛ kelen', hh: 'lɛrɛ %d', d: 'tile kelen', dd: 'tile %d', M: 'kalo kelen', MM: 'kalo %d', y: 'san kelen', yy: 'san %d' },
            week: { dow: 1, doy: 4 },
          });
        var fs = { 1: '১', 2: '২', 3: '৩', 4: '৪', 5: '৫', 6: '৬', 7: '৭', 8: '৮', 9: '৯', 0: '০' },
          ps = { '১': '1', '২': '2', '৩': '3', '৪': '4', '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9', '০': '0' };
        t.defineLocale('bn-bd', {
          months: 'জানুয়ারি_ফেব্রুয়ারি_মার্চ_এপ্রিল_মে_জুন_জুলাই_আগস্ট_সেপ্টেম্বর_অক্টোবর_নভেম্বর_ডিসেম্বর'.split('_'),
          monthsShort: 'জানু_ফেব্রু_মার্চ_এপ্রিল_মে_জুন_জুলাই_আগস্ট_সেপ্ট_অক্টো_নভে_ডিসে'.split('_'),
          weekdays: 'রবিবার_সোমবার_মঙ্গলবার_বুধবার_বৃহস্পতিবার_শুক্রবার_শনিবার'.split('_'),
          weekdaysShort: 'রবি_সোম_মঙ্গল_বুধ_বৃহস্পতি_শুক্র_শনি'.split('_'),
          weekdaysMin: 'রবি_সোম_মঙ্গল_বুধ_বৃহ_শুক্র_শনি'.split('_'),
          longDateFormat: { LT: 'A h:mm সময়', LTS: 'A h:mm:ss সময়', L: 'DD/MM/YYYY', LL: 'D MMMM YYYY', LLL: 'D MMMM YYYY, A h:mm সময়', LLLL: 'dddd, D MMMM YYYY, A h:mm সময়' },
          calendar: { sameDay: '[আজ] LT', nextDay: '[আগামীকাল] LT', nextWeek: 'dddd, LT', lastDay: '[গতকাল] LT', lastWeek: '[গত] dddd, LT', sameElse: 'L' },
          relativeTime: { future: '%s পরে', past: '%s আগে', s: 'কয়েক সেকেন্ড', ss: '%d সেকেন্ড', m: 'এক মিনিট', mm: '%d মিনিট', h: 'এক ঘন্টা', hh: '%d ঘন্টা', d: 'এক দিন', dd: '%d দিন', M: 'এক মাস', MM: '%d মাস', y: 'এক বছর', yy: '%d বছর' },
          preparse: function (e) {
            return e.replace(/[\u09e7\u09e8\u09e9\u09ea\u09eb\u09ec\u09ed\u09ee\u09ef\u09e6]/g, function (e) {
              return ps[e];
            });
          },
          postformat: function (e) {
            return e.replace(/\d/g, function (e) {
              return fs[e];
            });
          },
          meridiemParse: /\u09b0\u09be\u09a4|\u09ad\u09cb\u09b0|\u09b8\u0995\u09be\u09b2|\u09a6\u09c1\u09aa\u09c1\u09b0|\u09ac\u09bf\u0995\u09be\u09b2|\u09b8\u09a8\u09cd\u09a7\u09cd\u09af\u09be|\u09b0\u09be\u09a4/,
          meridiemHour: function (e, a) {
            return 12 === e && (e = 0), 'রাত' === a ? (e < 4 ? e : e + 12) : 'ভোর' === a || 'সকাল' === a ? e : 'দুপুর' === a ? (3 <= e ? e : e + 12) : 'বিকাল' === a || 'সন্ধ্যা' === a ? e + 12 : void 0;
          },
          meridiem: function (e, a, t) {
            return e < 4 ? 'রাত' : e < 6 ? 'ভোর' : e < 12 ? 'সকাল' : e < 15 ? 'দুপুর' : e < 18 ? 'বিকাল' : e < 20 ? 'সন্ধ্যা' : 'রাত';
          },
          week: { dow: 0, doy: 6 },
        });
        var ks = { 1: '১', 2: '২', 3: '৩', 4: '৪', 5: '৫', 6: '৬', 7: '৭', 8: '৮', 9: '৯', 0: '০' },
          Ds = { '১': '1', '২': '2', '৩': '3', '৪': '4', '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9', '০': '0' };
        t.defineLocale('bn', {
          months: 'জানুয়ারি_ফেব্রুয়ারি_মার্চ_এপ্রিল_মে_জুন_জুলাই_আগস্ট_সেপ্টেম্বর_অক্টোবর_নভেম্বর_ডিসেম্বর'.split('_'),
          monthsShort: 'জানু_ফেব্রু_মার্চ_এপ্রিল_মে_জুন_জুলাই_আগস্ট_সেপ্ট_অক্টো_নভে_ডিসে'.split('_'),
          weekdays: 'রবিবার_সোমবার_মঙ্গলবার_বুধবার_বৃহস্পতিবার_শুক্রবার_শনিবার'.split('_'),
          weekdaysShort: 'রবি_সোম_মঙ্গল_বুধ_বৃহস্পতি_শুক্র_শনি'.split('_'),
          weekdaysMin: 'রবি_সোম_মঙ্গল_বুধ_বৃহ_শুক্র_শনি'.split('_'),
          longDateFormat: { LT: 'A h:mm সময়', LTS: 'A h:mm:ss সময়', L: 'DD/MM/YYYY', LL: 'D MMMM YYYY', LLL: 'D MMMM YYYY, A h:mm সময়', LLLL: 'dddd, D MMMM YYYY, A h:mm সময়' },
          calendar: { sameDay: '[আজ] LT', nextDay: '[আগামীকাল] LT', nextWeek: 'dddd, LT', lastDay: '[গতকাল] LT', lastWeek: '[গত] dddd, LT', sameElse: 'L' },
          relativeTime: { future: '%s পরে', past: '%s আগে', s: 'কয়েক সেকেন্ড', ss: '%d সেকেন্ড', m: 'এক মিনিট', mm: '%d মিনিট', h: 'এক ঘন্টা', hh: '%d ঘন্টা', d: 'এক দিন', dd: '%d দিন', M: 'এক মাস', MM: '%d মাস', y: 'এক বছর', yy: '%d বছর' },
          preparse: function (e) {
            return e.replace(/[\u09e7\u09e8\u09e9\u09ea\u09eb\u09ec\u09ed\u09ee\u09ef\u09e6]/g, function (e) {
              return Ds[e];
            });
          },
          postformat: function (e) {
            return e.replace(/\d/g, function (e) {
              return ks[e];
            });
          },
          meridiemParse: /\u09b0\u09be\u09a4|\u09b8\u0995\u09be\u09b2|\u09a6\u09c1\u09aa\u09c1\u09b0|\u09ac\u09bf\u0995\u09be\u09b2|\u09b0\u09be\u09a4/,
          meridiemHour: function (e, a) {
            return 12 === e && (e = 0), ('রাত' === a && 4 <= e) || ('দুপুর' === a && e < 5) || 'বিকাল' === a ? e + 12 : e;
          },
          meridiem: function (e, a, t) {
            return e < 4 ? 'রাত' : e < 10 ? 'সকাল' : e < 17 ? 'দুপুর' : e < 20 ? 'বিকাল' : 'রাত';
          },
          week: { dow: 0, doy: 6 },
        });
        var Ts = { 1: '༡', 2: '༢', 3: '༣', 4: '༤', 5: '༥', 6: '༦', 7: '༧', 8: '༨', 9: '༩', 0: '༠' },
          gs = { '༡': '1', '༢': '2', '༣': '3', '༤': '4', '༥': '5', '༦': '6', '༧': '7', '༨': '8', '༩': '9', '༠': '0' };
        function ws(e, a, t) {
          var s;
          return (
            e +
            ' ' +
            ((s = { mm: 'munutenn', MM: 'miz', dd: 'devezh' }[t]),
            2 !== e
              ? s
              : (function (e) {
                  var a = { m: 'v', b: 'v', d: 'z' };
                  return void 0 !== a[e.charAt(0)] ? a[e.charAt(0)] + e.substring(1) : e;
                })(s))
          );
        }
        t.defineLocale('bo', {
          months: 'ཟླ་བ་དང་པོ_ཟླ་བ་གཉིས་པ_ཟླ་བ་གསུམ་པ_ཟླ་བ་བཞི་པ_ཟླ་བ་ལྔ་པ_ཟླ་བ་དྲུག་པ_ཟླ་བ་བདུན་པ_ཟླ་བ་བརྒྱད་པ_ཟླ་བ་དགུ་པ_ཟླ་བ་བཅུ་པ_ཟླ་བ་བཅུ་གཅིག་པ_ཟླ་བ་བཅུ་གཉིས་པ'.split('_'),
          monthsShort: 'ཟླ་1_ཟླ་2_ཟླ་3_ཟླ་4_ཟླ་5_ཟླ་6_ཟླ་7_ཟླ་8_ཟླ་9_ཟླ་10_ཟླ་11_ཟླ་12'.split('_'),
          monthsShortRegex: /^(\u0f5f\u0fb3\u0f0b\d{1,2})/,
          monthsParseExact: !0,
          weekdays: 'གཟའ་ཉི་མ་_གཟའ་ཟླ་བ་_གཟའ་མིག་དམར་_གཟའ་ལྷག་པ་_གཟའ་ཕུར་བུ_གཟའ་པ་སངས་_གཟའ་སྤེན་པ་'.split('_'),
          weekdaysShort: 'ཉི་མ་_ཟླ་བ་_མིག་དམར་_ལྷག་པ་_ཕུར་བུ_པ་སངས་_སྤེན་པ་'.split('_'),
          weekdaysMin: 'ཉི_ཟླ_མིག_ལྷག_ཕུར_སངས_སྤེན'.split('_'),
          longDateFormat: { LT: 'A h:mm', LTS: 'A h:mm:ss', L: 'DD/MM/YYYY', LL: 'D MMMM YYYY', LLL: 'D MMMM YYYY, A h:mm', LLLL: 'dddd, D MMMM YYYY, A h:mm' },
          calendar: { sameDay: '[དི་རིང] LT', nextDay: '[སང་ཉིན] LT', nextWeek: '[བདུན་ཕྲག་རྗེས་མ], LT', lastDay: '[ཁ་སང] LT', lastWeek: '[བདུན་ཕྲག་མཐའ་མ] dddd, LT', sameElse: 'L' },
          relativeTime: { future: '%s ལ་', past: '%s སྔན་ལ', s: 'ལམ་སང', ss: '%d སྐར་ཆ།', m: 'སྐར་མ་གཅིག', mm: '%d སྐར་མ', h: 'ཆུ་ཚོད་གཅིག', hh: '%d ཆུ་ཚོད', d: 'ཉིན་གཅིག', dd: '%d ཉིན་', M: 'ཟླ་བ་གཅིག', MM: '%d ཟླ་བ', y: 'ལོ་གཅིག', yy: '%d ལོ' },
          preparse: function (e) {
            return e.replace(/[\u0f21\u0f22\u0f23\u0f24\u0f25\u0f26\u0f27\u0f28\u0f29\u0f20]/g, function (e) {
              return gs[e];
            });
          },
          postformat: function (e) {
            return e.replace(/\d/g, function (e) {
              return Ts[e];
            });
          },
          meridiemParse: /\u0f58\u0f5a\u0f53\u0f0b\u0f58\u0f7c|\u0f5e\u0f7c\u0f42\u0f66\u0f0b\u0f40\u0f66|\u0f49\u0f72\u0f53\u0f0b\u0f42\u0f74\u0f44|\u0f51\u0f42\u0f7c\u0f44\u0f0b\u0f51\u0f42|\u0f58\u0f5a\u0f53\u0f0b\u0f58\u0f7c/,
          meridiemHour: function (e, a) {
            return 12 === e && (e = 0), ('མཚན་མོ' === a && 4 <= e) || ('ཉིན་གུང' === a && e < 5) || 'དགོང་དག' === a ? e + 12 : e;
          },
          meridiem: function (e, a, t) {
            return e < 4 ? 'མཚན་མོ' : e < 10 ? 'ཞོགས་ཀས' : e < 17 ? 'ཉིན་གུང' : e < 20 ? 'དགོང་དག' : 'མཚན་མོ';
          },
          week: { dow: 0, doy: 6 },
        });
        var bs = [/^gen/i, /^c[\u02bc\']hwe/i, /^meu/i, /^ebr/i, /^mae/i, /^(mez|eve)/i, /^gou/i, /^eos/i, /^gwe/i, /^her/i, /^du/i, /^ker/i],
          vs = /^(genver|c[\u02bc\']hwevrer|meurzh|ebrel|mae|mezheven|gouere|eost|gwengolo|here|du|kerzu|gen|c[\u02bc\']hwe|meu|ebr|mae|eve|gou|eos|gwe|her|du|ker)/i,
          Ss = [/^Su/i, /^Lu/i, /^Me([^r]|$)/i, /^Mer/i, /^Ya/i, /^Gw/i, /^Sa/i];
        function Hs(e, a, t) {
          var s = e + ' ';
          switch (t) {
            case 'ss':
              return (s += 1 === e ? 'sekunda' : 2 === e || 3 === e || 4 === e ? 'sekunde' : 'sekundi');
            case 'm':
              return a ? 'jedna minuta' : 'jedne minute';
            case 'mm':
              return (s += 1 !== e && (2 === e || 3 === e || 4 === e) ? 'minute' : 'minuta');
            case 'h':
              return a ? 'jedan sat' : 'jednog sata';
            case 'hh':
              return (s += 1 === e ? 'sat' : 2 === e || 3 === e || 4 === e ? 'sata' : 'sati');
            case 'dd':
              return (s += 1 === e ? 'dan' : 'dana');
            case 'MM':
              return (s += 1 === e ? 'mjesec' : 2 === e || 3 === e || 4 === e ? 'mjeseca' : 'mjeseci');
            case 'yy':
              return (s += 1 !== e && (2 === e || 3 === e || 4 === e) ? 'godine' : 'godina');
          }
        }
        t.defineLocale('br', {
          months: 'Genver_Cʼhwevrer_Meurzh_Ebrel_Mae_Mezheven_Gouere_Eost_Gwengolo_Here_Du_Kerzu'.split('_'),
          monthsShort: 'Gen_Cʼhwe_Meu_Ebr_Mae_Eve_Gou_Eos_Gwe_Her_Du_Ker'.split('_'),
          weekdays: 'Sul_Lun_Meurzh_Mercʼher_Yaou_Gwener_Sadorn'.split('_'),
          weekdaysShort: 'Sul_Lun_Meu_Mer_Yao_Gwe_Sad'.split('_'),
          weekdaysMin: 'Su_Lu_Me_Mer_Ya_Gw_Sa'.split('_'),
          weekdaysParse: Ss,
          fullWeekdaysParse: [/^sul/i, /^lun/i, /^meurzh/i, /^merc[\u02bc\']her/i, /^yaou/i, /^gwener/i, /^sadorn/i],
          shortWeekdaysParse: [/^Sul/i, /^Lun/i, /^Meu/i, /^Mer/i, /^Yao/i, /^Gwe/i, /^Sad/i],
          minWeekdaysParse: Ss,
          monthsRegex: vs,
          monthsShortRegex: vs,
          monthsStrictRegex: /^(genver|c[\u02bc\']hwevrer|meurzh|ebrel|mae|mezheven|gouere|eost|gwengolo|here|du|kerzu)/i,
          monthsShortStrictRegex: /^(gen|c[\u02bc\']hwe|meu|ebr|mae|eve|gou|eos|gwe|her|du|ker)/i,
          monthsParse: bs,
          longMonthsParse: bs,
          shortMonthsParse: bs,
          longDateFormat: { LT: 'HH:mm', LTS: 'HH:mm:ss', L: 'DD/MM/YYYY', LL: 'D [a viz] MMMM YYYY', LLL: 'D [a viz] MMMM YYYY HH:mm', LLLL: 'dddd, D [a viz] MMMM YYYY HH:mm' },
          calendar: { sameDay: '[Hiziv da] LT', nextDay: '[Warcʼhoazh da] LT', nextWeek: 'dddd [da] LT', lastDay: '[Decʼh da] LT', lastWeek: 'dddd [paset da] LT', sameElse: 'L' },
          relativeTime: {
            future: 'a-benn %s',
            past: '%s ʼzo',
            s: 'un nebeud segondennoù',
            ss: '%d eilenn',
            m: 'ur vunutenn',
            mm: ws,
            h: 'un eur',
            hh: '%d eur',
            d: 'un devezh',
            dd: ws,
            M: 'ur miz',
            MM: ws,
            y: 'ur bloaz',
            yy: function (e) {
              switch (
                (function e(a) {
                  if (9 < a) return e(a % 10);
                  return a;
                })(e)
              ) {
                case 1:
                case 3:
                case 4:
                case 5:
                case 9:
                  return e + ' bloaz';
                default:
                  return e + ' vloaz';
              }
            },
          },
          dayOfMonthOrdinalParse: /\d{1,2}(a\xf1|vet)/,
          ordinal: function (e) {
            return e + (1 === e ? 'añ' : 'vet');
          },
          week: { dow: 1, doy: 4 },
          meridiemParse: /a.m.|g.m./,
          isPM: function (e) {
            return 'g.m.' === e;
          },
          meridiem: function (e, a, t) {
            return e < 12 ? 'a.m.' : 'g.m.';
          },
        }),
          t.defineLocale('bs', {
            months: 'januar_februar_mart_april_maj_juni_juli_august_septembar_oktobar_novembar_decembar'.split('_'),
            monthsShort: 'jan._feb._mar._apr._maj._jun._jul._aug._sep._okt._nov._dec.'.split('_'),
            monthsParseExact: !0,
            weekdays: 'nedjelja_ponedjeljak_utorak_srijeda_četvrtak_petak_subota'.split('_'),
            weekdaysShort: 'ned._pon._uto._sri._čet._pet._sub.'.split('_'),
            weekdaysMin: 'ne_po_ut_sr_če_pe_su'.split('_'),
            weekdaysParseExact: !0,
            longDateFormat: { LT: 'H:mm', LTS: 'H:mm:ss', L: 'DD.MM.YYYY', LL: 'D. MMMM YYYY', LLL: 'D. MMMM YYYY H:mm', LLLL: 'dddd, D. MMMM YYYY H:mm' },
            calendar: {
              sameDay: '[danas u] LT',
              nextDay: '[sutra u] LT',
              nextWeek: function () {
                switch (this.day()) {
                  case 0:
                    return '[u] [nedjelju] [u] LT';
                  case 3:
                    return '[u] [srijedu] [u] LT';
                  case 6:
                    return '[u] [subotu] [u] LT';
                  case 1:
                  case 2:
                  case 4:
                  case 5:
                    return '[u] dddd [u] LT';
                }
              },
              lastDay: '[jučer u] LT',
              lastWeek: function () {
                switch (this.day()) {
                  case 0:
                  case 3:
                    return '[prošlu] dddd [u] LT';
                  case 6:
                    return '[prošle] [subote] [u] LT';
                  case 1:
                  case 2:
                  case 4:
                  case 5:
                    return '[prošli] dddd [u] LT';
                }
              },
              sameElse: 'L',
            },
            relativeTime: { future: 'za %s', past: 'prije %s', s: 'par sekundi', ss: Hs, m: Hs, mm: Hs, h: Hs, hh: Hs, d: 'dan', dd: Hs, M: 'mjesec', MM: Hs, y: 'godinu', yy: Hs },
            dayOfMonthOrdinalParse: /\d{1,2}\./,
            ordinal: '%d.',
            week: { dow: 1, doy: 7 },
          }),
          t.defineLocale('ca', {
            months: { standalone: 'gener_febrer_març_abril_maig_juny_juliol_agost_setembre_octubre_novembre_desembre'.split('_'), format: "de gener_de febrer_de març_d'abril_de maig_de juny_de juliol_d'agost_de setembre_d'octubre_de novembre_de desembre".split('_'), isFormat: /D[oD]?(\s)+MMMM/ },
            monthsShort: 'gen._febr._març_abr._maig_juny_jul._ag._set._oct._nov._des.'.split('_'),
            monthsParseExact: !0,
            weekdays: 'diumenge_dilluns_dimarts_dimecres_dijous_divendres_dissabte'.split('_'),
            weekdaysShort: 'dg._dl._dt._dc._dj._dv._ds.'.split('_'),
            weekdaysMin: 'dg_dl_dt_dc_dj_dv_ds'.split('_'),
            weekdaysParseExact: !0,
            longDateFormat: { LT: 'H:mm', LTS: 'H:mm:ss', L: 'DD/MM/YYYY', LL: 'D MMMM [de] YYYY', ll: 'D MMM YYYY', LLL: 'D MMMM [de] YYYY [a les] H:mm', lll: 'D MMM YYYY, H:mm', LLLL: 'dddd D MMMM [de] YYYY [a les] H:mm', llll: 'ddd D MMM YYYY, H:mm' },
            calendar: {
              sameDay: function () {
                return '[avui a ' + (1 !== this.hours() ? 'les' : 'la') + '] LT';
              },
              nextDay: function () {
                return '[demà a ' + (1 !== this.hours() ? 'les' : 'la') + '] LT';
              },
              nextWeek: function () {
                return 'dddd [a ' + (1 !== this.hours() ? 'les' : 'la') + '] LT';
              },
              lastDay: function () {
                return '[ahir a ' + (1 !== this.hours() ? 'les' : 'la') + '] LT';
              },
              lastWeek: function () {
                return '[el] dddd [passat a ' + (1 !== this.hours() ? 'les' : 'la') + '] LT';
              },
              sameElse: 'L',
            },
            relativeTime: { future: "d'aquí %s", past: 'fa %s', s: 'uns segons', ss: '%d segons', m: 'un minut', mm: '%d minuts', h: 'una hora', hh: '%d hores', d: 'un dia', dd: '%d dies', M: 'un mes', MM: '%d mesos', y: 'un any', yy: '%d anys' },
            dayOfMonthOrdinalParse: /\d{1,2}(r|n|t|\xe8|a)/,
            ordinal: function (e, a) {
              return e + ('w' !== a && 'W' !== a ? (1 === e ? 'r' : 2 === e ? 'n' : 3 === e ? 'r' : 4 === e ? 't' : 'è') : 'a');
            },
            week: { dow: 1, doy: 4 },
          });
        var js = 'leden_únor_březen_duben_květen_červen_červenec_srpen_září_říjen_listopad_prosinec'.split('_'),
          xs = 'led_úno_bře_dub_kvě_čvn_čvc_srp_zář_říj_lis_pro'.split('_'),
          Ps = [/^led/i, /^\xfano/i, /^b\u0159e/i, /^dub/i, /^kv\u011b/i, /^(\u010dvn|\u010derven$|\u010dervna)/i, /^(\u010dvc|\u010dervenec|\u010dervence)/i, /^srp/i, /^z\xe1\u0159/i, /^\u0159\xedj/i, /^lis/i, /^pro/i],
          Os = /^(leden|\xfanor|b\u0159ezen|duben|kv\u011bten|\u010dervenec|\u010dervence|\u010derven|\u010dervna|srpen|z\xe1\u0159\xed|\u0159\xedjen|listopad|prosinec|led|\xfano|b\u0159e|dub|kv\u011b|\u010dvn|\u010dvc|srp|z\xe1\u0159|\u0159\xedj|lis|pro)/i;
        function Ws(e) {
          return 1 < e && e < 5 && 1 != ~~(e / 10);
        }
        function As(e, a, t, s) {
          var n = e + ' ';
          switch (t) {
            case 's':
              return a || s ? 'pár sekund' : 'pár sekundami';
            case 'ss':
              return a || s ? n + (Ws(e) ? 'sekundy' : 'sekund') : n + 'sekundami';
            case 'm':
              return a ? 'minuta' : s ? 'minutu' : 'minutou';
            case 'mm':
              return a || s ? n + (Ws(e) ? 'minuty' : 'minut') : n + 'minutami';
            case 'h':
              return a ? 'hodina' : s ? 'hodinu' : 'hodinou';
            case 'hh':
              return a || s ? n + (Ws(e) ? 'hodiny' : 'hodin') : n + 'hodinami';
            case 'd':
              return a || s ? 'den' : 'dnem';
            case 'dd':
              return a || s ? n + (Ws(e) ? 'dny' : 'dní') : n + 'dny';
            case 'M':
              return a || s ? 'měsíc' : 'měsícem';
            case 'MM':
              return a || s ? n + (Ws(e) ? 'měsíce' : 'měsíců') : n + 'měsíci';
            case 'y':
              return a || s ? 'rok' : 'rokem';
            case 'yy':
              return a || s ? n + (Ws(e) ? 'roky' : 'let') : n + 'lety';
          }
        }
        function Es(e, a, t, s) {
          var n = {
            m: ['eine Minute', 'einer Minute'],
            h: ['eine Stunde', 'einer Stunde'],
            d: ['ein Tag', 'einem Tag'],
            dd: [e + ' Tage', e + ' Tagen'],
            w: ['eine Woche', 'einer Woche'],
            M: ['ein Monat', 'einem Monat'],
            MM: [e + ' Monate', e + ' Monaten'],
            y: ['ein Jahr', 'einem Jahr'],
            yy: [e + ' Jahre', e + ' Jahren'],
          };
          return a ? n[t][0] : n[t][1];
        }
        function Fs(e, a, t, s) {
          var n = {
            m: ['eine Minute', 'einer Minute'],
            h: ['eine Stunde', 'einer Stunde'],
            d: ['ein Tag', 'einem Tag'],
            dd: [e + ' Tage', e + ' Tagen'],
            w: ['eine Woche', 'einer Woche'],
            M: ['ein Monat', 'einem Monat'],
            MM: [e + ' Monate', e + ' Monaten'],
            y: ['ein Jahr', 'einem Jahr'],
            yy: [e + ' Jahre', e + ' Jahren'],
          };
          return a ? n[t][0] : n[t][1];
        }
        function zs(e, a, t, s) {
          var n = {
            m: ['eine Minute', 'einer Minute'],
            h: ['eine Stunde', 'einer Stunde'],
            d: ['ein Tag', 'einem Tag'],
            dd: [e + ' Tage', e + ' Tagen'],
            w: ['eine Woche', 'einer Woche'],
            M: ['ein Monat', 'einem Monat'],
            MM: [e + ' Monate', e + ' Monaten'],
            y: ['ein Jahr', 'einem Jahr'],
            yy: [e + ' Jahre', e + ' Jahren'],
          };
          return a ? n[t][0] : n[t][1];
        }
        t.defineLocale('cs', {
          months: js,
          monthsShort: xs,
          monthsRegex: Os,
          monthsShortRegex: Os,
          monthsStrictRegex: /^(leden|ledna|\xfanora|\xfanor|b\u0159ezen|b\u0159ezna|duben|dubna|kv\u011bten|kv\u011btna|\u010dervenec|\u010dervence|\u010derven|\u010dervna|srpen|srpna|z\xe1\u0159\xed|\u0159\xedjen|\u0159\xedjna|listopadu|listopad|prosinec|prosince)/i,
          monthsShortStrictRegex: /^(led|\xfano|b\u0159e|dub|kv\u011b|\u010dvn|\u010dvc|srp|z\xe1\u0159|\u0159\xedj|lis|pro)/i,
          monthsParse: Ps,
          longMonthsParse: Ps,
          shortMonthsParse: Ps,
          weekdays: 'neděle_pondělí_úterý_středa_čtvrtek_pátek_sobota'.split('_'),
          weekdaysShort: 'ne_po_út_st_čt_pá_so'.split('_'),
          weekdaysMin: 'ne_po_út_st_čt_pá_so'.split('_'),
          longDateFormat: { LT: 'H:mm', LTS: 'H:mm:ss', L: 'DD.MM.YYYY', LL: 'D. MMMM YYYY', LLL: 'D. MMMM YYYY H:mm', LLLL: 'dddd D. MMMM YYYY H:mm', l: 'D. M. YYYY' },
          calendar: {
            sameDay: '[dnes v] LT',
            nextDay: '[zítra v] LT',
            nextWeek: function () {
              switch (this.day()) {
                case 0:
                  return '[v neděli v] LT';
                case 1:
                case 2:
                  return '[v] dddd [v] LT';
                case 3:
                  return '[ve středu v] LT';
                case 4:
                  return '[ve čtvrtek v] LT';
                case 5:
                  return '[v pátek v] LT';
                case 6:
                  return '[v sobotu v] LT';
              }
            },
            lastDay: '[včera v] LT',
            lastWeek: function () {
              switch (this.day()) {
                case 0:
                  return '[minulou neděli v] LT';
                case 1:
                case 2:
                  return '[minulé] dddd [v] LT';
                case 3:
                  return '[minulou středu v] LT';
                case 4:
                case 5:
                  return '[minulý] dddd [v] LT';
                case 6:
                  return '[minulou sobotu v] LT';
              }
            },
            sameElse: 'L',
          },
          relativeTime: { future: 'za %s', past: 'před %s', s: As, ss: As, m: As, mm: As, h: As, hh: As, d: As, dd: As, M: As, MM: As, y: As, yy: As },
          dayOfMonthOrdinalParse: /\d{1,2}\./,
          ordinal: '%d.',
          week: { dow: 1, doy: 4 },
        }),
          t.defineLocale('cv', {
            months: 'кӑрлач_нарӑс_пуш_ака_май_ҫӗртме_утӑ_ҫурла_авӑн_юпа_чӳк_раштав'.split('_'),
            monthsShort: 'кӑр_нар_пуш_ака_май_ҫӗр_утӑ_ҫур_авн_юпа_чӳк_раш'.split('_'),
            weekdays: 'вырсарникун_тунтикун_ытларикун_юнкун_кӗҫнерникун_эрнекун_шӑматкун'.split('_'),
            weekdaysShort: 'выр_тун_ытл_юн_кӗҫ_эрн_шӑм'.split('_'),
            weekdaysMin: 'вр_тн_ыт_юн_кҫ_эр_шм'.split('_'),
            longDateFormat: { LT: 'HH:mm', LTS: 'HH:mm:ss', L: 'DD-MM-YYYY', LL: 'YYYY [ҫулхи] MMMM [уйӑхӗн] D[-мӗшӗ]', LLL: 'YYYY [ҫулхи] MMMM [уйӑхӗн] D[-мӗшӗ], HH:mm', LLLL: 'dddd, YYYY [ҫулхи] MMMM [уйӑхӗн] D[-мӗшӗ], HH:mm' },
            calendar: { sameDay: '[Паян] LT [сехетре]', nextDay: '[Ыран] LT [сехетре]', lastDay: '[Ӗнер] LT [сехетре]', nextWeek: '[Ҫитес] dddd LT [сехетре]', lastWeek: '[Иртнӗ] dddd LT [сехетре]', sameElse: 'L' },
            relativeTime: {
              future: function (e) {
                return e + (/\u0441\u0435\u0445\u0435\u0442$/i.exec(e) ? 'рен' : /\u04ab\u0443\u043b$/i.exec(e) ? 'тан' : 'ран');
              },
              past: '%s каялла',
              s: 'пӗр-ик ҫеккунт',
              ss: '%d ҫеккунт',
              m: 'пӗр минут',
              mm: '%d минут',
              h: 'пӗр сехет',
              hh: '%d сехет',
              d: 'пӗр кун',
              dd: '%d кун',
              M: 'пӗр уйӑх',
              MM: '%d уйӑх',
              y: 'пӗр ҫул',
              yy: '%d ҫул',
            },
            dayOfMonthOrdinalParse: /\d{1,2}-\u043c\u04d7\u0448/,
            ordinal: '%d-мӗш',
            week: { dow: 1, doy: 7 },
          }),
          t.defineLocale('cy', {
            months: 'Ionawr_Chwefror_Mawrth_Ebrill_Mai_Mehefin_Gorffennaf_Awst_Medi_Hydref_Tachwedd_Rhagfyr'.split('_'),
            monthsShort: 'Ion_Chwe_Maw_Ebr_Mai_Meh_Gor_Aws_Med_Hyd_Tach_Rhag'.split('_'),
            weekdays: 'Dydd Sul_Dydd Llun_Dydd Mawrth_Dydd Mercher_Dydd Iau_Dydd Gwener_Dydd Sadwrn'.split('_'),
            weekdaysShort: 'Sul_Llun_Maw_Mer_Iau_Gwe_Sad'.split('_'),
            weekdaysMin: 'Su_Ll_Ma_Me_Ia_Gw_Sa'.split('_'),
            weekdaysParseExact: !0,
            longDateFormat: { LT: 'HH:mm', LTS: 'HH:mm:ss', L: 'DD/MM/YYYY', LL: 'D MMMM YYYY', LLL: 'D MMMM YYYY HH:mm', LLLL: 'dddd, D MMMM YYYY HH:mm' },
            calendar: { sameDay: '[Heddiw am] LT', nextDay: '[Yfory am] LT', nextWeek: 'dddd [am] LT', lastDay: '[Ddoe am] LT', lastWeek: 'dddd [diwethaf am] LT', sameElse: 'L' },
            relativeTime: { future: 'mewn %s', past: '%s yn ôl', s: 'ychydig eiliadau', ss: '%d eiliad', m: 'munud', mm: '%d munud', h: 'awr', hh: '%d awr', d: 'diwrnod', dd: '%d diwrnod', M: 'mis', MM: '%d mis', y: 'blwyddyn', yy: '%d flynedd' },
            dayOfMonthOrdinalParse: /\d{1,2}(fed|ain|af|il|ydd|ed|eg)/,
            ordinal: function (e) {
              var a = '';
              return 20 < e ? (a = 40 === e || 50 === e || 60 === e || 80 === e || 100 === e ? 'fed' : 'ain') : 0 < e && (a = ['', 'af', 'il', 'ydd', 'ydd', 'ed', 'ed', 'ed', 'fed', 'fed', 'fed', 'eg', 'fed', 'eg', 'eg', 'fed', 'eg', 'eg', 'fed', 'eg', 'fed'][e]), e + a;
            },
            week: { dow: 1, doy: 4 },
          }),
          t.defineLocale('da', {
            months: 'januar_februar_marts_april_maj_juni_juli_august_september_oktober_november_december'.split('_'),
            monthsShort: 'jan_feb_mar_apr_maj_jun_jul_aug_sep_okt_nov_dec'.split('_'),
            weekdays: 'søndag_mandag_tirsdag_onsdag_torsdag_fredag_lørdag'.split('_'),
            weekdaysShort: 'søn_man_tir_ons_tor_fre_lør'.split('_'),
            weekdaysMin: 'sø_ma_ti_on_to_fr_lø'.split('_'),
            longDateFormat: { LT: 'HH:mm', LTS: 'HH:mm:ss', L: 'DD.MM.YYYY', LL: 'D. MMMM YYYY', LLL: 'D. MMMM YYYY HH:mm', LLLL: 'dddd [d.] D. MMMM YYYY [kl.] HH:mm' },
            calendar: { sameDay: '[i dag kl.] LT', nextDay: '[i morgen kl.] LT', nextWeek: 'på dddd [kl.] LT', lastDay: '[i går kl.] LT', lastWeek: '[i] dddd[s kl.] LT', sameElse: 'L' },
            relativeTime: { future: 'om %s', past: '%s siden', s: 'få sekunder', ss: '%d sekunder', m: 'et minut', mm: '%d minutter', h: 'en time', hh: '%d timer', d: 'en dag', dd: '%d dage', M: 'en måned', MM: '%d måneder', y: 'et år', yy: '%d år' },
            dayOfMonthOrdinalParse: /\d{1,2}\./,
            ordinal: '%d.',
            week: { dow: 1, doy: 4 },
          }),
          t.defineLocale('de-at', {
            months: 'Jänner_Februar_März_April_Mai_Juni_Juli_August_September_Oktober_November_Dezember'.split('_'),
            monthsShort: 'Jän._Feb._März_Apr._Mai_Juni_Juli_Aug._Sep._Okt._Nov._Dez.'.split('_'),
            monthsParseExact: !0,
            weekdays: 'Sonntag_Montag_Dienstag_Mittwoch_Donnerstag_Freitag_Samstag'.split('_'),
            weekdaysShort: 'So._Mo._Di._Mi._Do._Fr._Sa.'.split('_'),
            weekdaysMin: 'So_Mo_Di_Mi_Do_Fr_Sa'.split('_'),
            weekdaysParseExact: !0,
            longDateFormat: { LT: 'HH:mm', LTS: 'HH:mm:ss', L: 'DD.MM.YYYY', LL: 'D. MMMM YYYY', LLL: 'D. MMMM YYYY HH:mm', LLLL: 'dddd, D. MMMM YYYY HH:mm' },
            calendar: { sameDay: '[heute um] LT [Uhr]', sameElse: 'L', nextDay: '[morgen um] LT [Uhr]', nextWeek: 'dddd [um] LT [Uhr]', lastDay: '[gestern um] LT [Uhr]', lastWeek: '[letzten] dddd [um] LT [Uhr]' },
            relativeTime: { future: 'in %s', past: 'vor %s', s: 'ein paar Sekunden', ss: '%d Sekunden', m: Es, mm: '%d Minuten', h: Es, hh: '%d Stunden', d: Es, dd: Es, w: Es, ww: '%d Wochen', M: Es, MM: Es, y: Es, yy: Es },
            dayOfMonthOrdinalParse: /\d{1,2}\./,
            ordinal: '%d.',
            week: { dow: 1, doy: 4 },
          }),
          t.defineLocale('de-ch', {
            months: 'Januar_Februar_März_April_Mai_Juni_Juli_August_September_Oktober_November_Dezember'.split('_'),
            monthsShort: 'Jan._Feb._März_Apr._Mai_Juni_Juli_Aug._Sep._Okt._Nov._Dez.'.split('_'),
            monthsParseExact: !0,
            weekdays: 'Sonntag_Montag_Dienstag_Mittwoch_Donnerstag_Freitag_Samstag'.split('_'),
            weekdaysShort: 'So_Mo_Di_Mi_Do_Fr_Sa'.split('_'),
            weekdaysMin: 'So_Mo_Di_Mi_Do_Fr_Sa'.split('_'),
            weekdaysParseExact: !0,
            longDateFormat: { LT: 'HH:mm', LTS: 'HH:mm:ss', L: 'DD.MM.YYYY', LL: 'D. MMMM YYYY', LLL: 'D. MMMM YYYY HH:mm', LLLL: 'dddd, D. MMMM YYYY HH:mm' },
            calendar: { sameDay: '[heute um] LT [Uhr]', sameElse: 'L', nextDay: '[morgen um] LT [Uhr]', nextWeek: 'dddd [um] LT [Uhr]', lastDay: '[gestern um] LT [Uhr]', lastWeek: '[letzten] dddd [um] LT [Uhr]' },
            relativeTime: { future: 'in %s', past: 'vor %s', s: 'ein paar Sekunden', ss: '%d Sekunden', m: Fs, mm: '%d Minuten', h: Fs, hh: '%d Stunden', d: Fs, dd: Fs, w: Fs, ww: '%d Wochen', M: Fs, MM: Fs, y: Fs, yy: Fs },
            dayOfMonthOrdinalParse: /\d{1,2}\./,
            ordinal: '%d.',
            week: { dow: 1, doy: 4 },
          }),
          t.defineLocale('de', {
            months: 'Januar_Februar_März_April_Mai_Juni_Juli_August_September_Oktober_November_Dezember'.split('_'),
            monthsShort: 'Jan._Feb._März_Apr._Mai_Juni_Juli_Aug._Sep._Okt._Nov._Dez.'.split('_'),
            monthsParseExact: !0,
            weekdays: 'Sonntag_Montag_Dienstag_Mittwoch_Donnerstag_Freitag_Samstag'.split('_'),
            weekdaysShort: 'So._Mo._Di._Mi._Do._Fr._Sa.'.split('_'),
            weekdaysMin: 'So_Mo_Di_Mi_Do_Fr_Sa'.split('_'),
            weekdaysParseExact: !0,
            longDateFormat: { LT: 'HH:mm', LTS: 'HH:mm:ss', L: 'DD.MM.YYYY', LL: 'D. MMMM YYYY', LLL: 'D. MMMM YYYY HH:mm', LLLL: 'dddd, D. MMMM YYYY HH:mm' },
            calendar: { sameDay: '[heute um] LT [Uhr]', sameElse: 'L', nextDay: '[morgen um] LT [Uhr]', nextWeek: 'dddd [um] LT [Uhr]', lastDay: '[gestern um] LT [Uhr]', lastWeek: '[letzten] dddd [um] LT [Uhr]' },
            relativeTime: { future: 'in %s', past: 'vor %s', s: 'ein paar Sekunden', ss: '%d Sekunden', m: zs, mm: '%d Minuten', h: zs, hh: '%d Stunden', d: zs, dd: zs, w: zs, ww: '%d Wochen', M: zs, MM: zs, y: zs, yy: zs },
            dayOfMonthOrdinalParse: /\d{1,2}\./,
            ordinal: '%d.',
            week: { dow: 1, doy: 4 },
          });
        var Ns = ['ޖެނުއަރީ', 'ފެބްރުއަރީ', 'މާރިޗު', 'އޭޕްރީލު', 'މޭ', 'ޖޫން', 'ޖުލައި', 'އޯގަސްޓު', 'ސެޕްޓެމްބަރު', 'އޮކްޓޯބަރު', 'ނޮވެމްބަރު', 'ޑިސެމްބަރު'],
          Js = ['އާދިއްތަ', 'ހޯމަ', 'އަންގާރަ', 'ބުދަ', 'ބުރާސްފަތި', 'ހުކުރު', 'ހޮނިހިރު'];
        t.defineLocale('dv', {
          months: Ns,
          monthsShort: Ns,
          weekdays: Js,
          weekdaysShort: Js,
          weekdaysMin: 'އާދި_ހޯމަ_އަން_ބުދަ_ބުރާ_ހުކު_ހޮނި'.split('_'),
          longDateFormat: { LT: 'HH:mm', LTS: 'HH:mm:ss', L: 'D/M/YYYY', LL: 'D MMMM YYYY', LLL: 'D MMMM YYYY HH:mm', LLLL: 'dddd D MMMM YYYY HH:mm' },
          meridiemParse: /\u0789\u0786|\u0789\u078a/,
          isPM: function (e) {
            return 'މފ' === e;
          },
          meridiem: function (e, a, t) {
            return e < 12 ? 'މކ' : 'މފ';
          },
          calendar: { sameDay: '[މިއަދު] LT', nextDay: '[މާދަމާ] LT', nextWeek: 'dddd LT', lastDay: '[އިއްޔެ] LT', lastWeek: '[ފާއިތުވި] dddd LT', sameElse: 'L' },
          relativeTime: { future: 'ތެރޭގައި %s', past: 'ކުރިން %s', s: 'ސިކުންތުކޮޅެއް', ss: 'd% ސިކުންތު', m: 'މިނިޓެއް', mm: 'މިނިޓު %d', h: 'ގަޑިއިރެއް', hh: 'ގަޑިއިރު %d', d: 'ދުވަހެއް', dd: 'ދުވަސް %d', M: 'މަހެއް', MM: 'މަސް %d', y: 'އަހަރެއް', yy: 'އަހަރު %d' },
          preparse: function (e) {
            return e.replace(/\u060c/g, ',');
          },
          postformat: function (e) {
            return e.replace(/,/g, '،');
          },
          week: { dow: 7, doy: 12 },
        }),
          t.defineLocale('el', {
            monthsNominativeEl: 'Ιανουάριος_Φεβρουάριος_Μάρτιος_Απρίλιος_Μάιος_Ιούνιος_Ιούλιος_Αύγουστος_Σεπτέμβριος_Οκτώβριος_Νοέμβριος_Δεκέμβριος'.split('_'),
            monthsGenitiveEl: 'Ιανουαρίου_Φεβρουαρίου_Μαρτίου_Απριλίου_Μαΐου_Ιουνίου_Ιουλίου_Αυγούστου_Σεπτεμβρίου_Οκτωβρίου_Νοεμβρίου_Δεκεμβρίου'.split('_'),
            months: function (e, a) {
              return e ? ('string' == typeof a && /D/.test(a.substring(0, a.indexOf('MMMM'))) ? this._monthsGenitiveEl[e.month()] : this._monthsNominativeEl[e.month()]) : this._monthsNominativeEl;
            },
            monthsShort: 'Ιαν_Φεβ_Μαρ_Απρ_Μαϊ_Ιουν_Ιουλ_Αυγ_Σεπ_Οκτ_Νοε_Δεκ'.split('_'),
            weekdays: 'Κυριακή_Δευτέρα_Τρίτη_Τετάρτη_Πέμπτη_Παρασκευή_Σάββατο'.split('_'),
            weekdaysShort: 'Κυρ_Δευ_Τρι_Τετ_Πεμ_Παρ_Σαβ'.split('_'),
            weekdaysMin: 'Κυ_Δε_Τρ_Τε_Πε_Πα_Σα'.split('_'),
            meridiem: function (e, a, t) {
              return 11 < e ? (t ? 'μμ' : 'ΜΜ') : t ? 'πμ' : 'ΠΜ';
            },
            isPM: function (e) {
              return 'μ' === (e + '').toLowerCase()[0];
            },
            meridiemParse: /[\u03a0\u039c]\.?\u039c?\.?/i,
            longDateFormat: { LT: 'h:mm A', LTS: 'h:mm:ss A', L: 'DD/MM/YYYY', LL: 'D MMMM YYYY', LLL: 'D MMMM YYYY h:mm A', LLLL: 'dddd, D MMMM YYYY h:mm A' },
            calendarEl: {
              sameDay: '[Σήμερα {}] LT',
              nextDay: '[Αύριο {}] LT',
              nextWeek: 'dddd [{}] LT',
              lastDay: '[Χθες {}] LT',
              lastWeek: function () {
                switch (this.day()) {
                  case 6:
                    return '[το προηγούμενο] dddd [{}] LT';
                  default:
                    return '[την προηγούμενη] dddd [{}] LT';
                }
              },
              sameElse: 'L',
            },
            calendar: function (e, a) {
              var t,
                s = this._calendarEl[e],
                n = a && a.hours();
              return (t = s), (('undefined' != typeof Function && t instanceof Function) || '[object Function]' === Object.prototype.toString.call(t)) && (s = s.apply(a)), s.replace('{}', n % 12 == 1 ? 'στη' : 'στις');
            },
            relativeTime: { future: 'σε %s', past: '%s πριν', s: 'λίγα δευτερόλεπτα', ss: '%d δευτερόλεπτα', m: 'ένα λεπτό', mm: '%d λεπτά', h: 'μία ώρα', hh: '%d ώρες', d: 'μία μέρα', dd: '%d μέρες', M: 'ένας μήνας', MM: '%d μήνες', y: 'ένας χρόνος', yy: '%d χρόνια' },
            dayOfMonthOrdinalParse: /\d{1,2}\u03b7/,
            ordinal: '%dη',
            week: { dow: 1, doy: 4 },
          }),
          t.defineLocale('en-au', {
            months: 'January_February_March_April_May_June_July_August_September_October_November_December'.split('_'),
            monthsShort: 'Jan_Feb_Mar_Apr_May_Jun_Jul_Aug_Sep_Oct_Nov_Dec'.split('_'),
            weekdays: 'Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday'.split('_'),
            weekdaysShort: 'Sun_Mon_Tue_Wed_Thu_Fri_Sat'.split('_'),
            weekdaysMin: 'Su_Mo_Tu_We_Th_Fr_Sa'.split('_'),
            longDateFormat: { LT: 'h:mm A', LTS: 'h:mm:ss A', L: 'DD/MM/YYYY', LL: 'D MMMM YYYY', LLL: 'D MMMM YYYY h:mm A', LLLL: 'dddd, D MMMM YYYY h:mm A' },
            calendar: { sameDay: '[Today at] LT', nextDay: '[Tomorrow at] LT', nextWeek: 'dddd [at] LT', lastDay: '[Yesterday at] LT', lastWeek: '[Last] dddd [at] LT', sameElse: 'L' },
            relativeTime: { future: 'in %s', past: '%s ago', s: 'a few seconds', ss: '%d seconds', m: 'a minute', mm: '%d minutes', h: 'an hour', hh: '%d hours', d: 'a day', dd: '%d days', M: 'a month', MM: '%d months', y: 'a year', yy: '%d years' },
            dayOfMonthOrdinalParse: /\d{1,2}(st|nd|rd|th)/,
            ordinal: function (e) {
              var a = e % 10;
              return e + (1 == ~~((e % 100) / 10) ? 'th' : 1 == a ? 'st' : 2 == a ? 'nd' : 3 == a ? 'rd' : 'th');
            },
            week: { dow: 0, doy: 4 },
          }),
          t.defineLocale('en-ca', {
            months: 'January_February_March_April_May_June_July_August_September_October_November_December'.split('_'),
            monthsShort: 'Jan_Feb_Mar_Apr_May_Jun_Jul_Aug_Sep_Oct_Nov_Dec'.split('_'),
            weekdays: 'Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday'.split('_'),
            weekdaysShort: 'Sun_Mon_Tue_Wed_Thu_Fri_Sat'.split('_'),
            weekdaysMin: 'Su_Mo_Tu_We_Th_Fr_Sa'.split('_'),
            longDateFormat: { LT: 'h:mm A', LTS: 'h:mm:ss A', L: 'YYYY-MM-DD', LL: 'MMMM D, YYYY', LLL: 'MMMM D, YYYY h:mm A', LLLL: 'dddd, MMMM D, YYYY h:mm A' },
            calendar: { sameDay: '[Today at] LT', nextDay: '[Tomorrow at] LT', nextWeek: 'dddd [at] LT', lastDay: '[Yesterday at] LT', lastWeek: '[Last] dddd [at] LT', sameElse: 'L' },
            relativeTime: { future: 'in %s', past: '%s ago', s: 'a few seconds', ss: '%d seconds', m: 'a minute', mm: '%d minutes', h: 'an hour', hh: '%d hours', d: 'a day', dd: '%d days', M: 'a month', MM: '%d months', y: 'a year', yy: '%d years' },
            dayOfMonthOrdinalParse: /\d{1,2}(st|nd|rd|th)/,
            ordinal: function (e) {
              var a = e % 10;
              return e + (1 == ~~((e % 100) / 10) ? 'th' : 1 == a ? 'st' : 2 == a ? 'nd' : 3 == a ? 'rd' : 'th');
            },
          }),
          t.defineLocale('en-gb', {
            months: 'January_February_March_April_May_June_July_August_September_October_November_December'.split('_'),
            monthsShort: 'Jan_Feb_Mar_Apr_May_Jun_Jul_Aug_Sep_Oct_Nov_Dec'.split('_'),
            weekdays: 'Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday'.split('_'),
            weekdaysShort: 'Sun_Mon_Tue_Wed_Thu_Fri_Sat'.split('_'),
            weekdaysMin: 'Su_Mo_Tu_We_Th_Fr_Sa'.split('_'),
            longDateFormat: { LT: 'HH:mm', LTS: 'HH:mm:ss', L: 'DD/MM/YYYY', LL: 'D MMMM YYYY', LLL: 'D MMMM YYYY HH:mm', LLLL: 'dddd, D MMMM YYYY HH:mm' },
            calendar: { sameDay: '[Today at] LT', nextDay: '[Tomorrow at] LT', nextWeek: 'dddd [at] LT', lastDay: '[Yesterday at] LT', lastWeek: '[Last] dddd [at] LT', sameElse: 'L' },
            relativeTime: { future: 'in %s', past: '%s ago', s: 'a few seconds', ss: '%d seconds', m: 'a minute', mm: '%d minutes', h: 'an hour', hh: '%d hours', d: 'a day', dd: '%d days', M: 'a month', MM: '%d months', y: 'a year', yy: '%d years' },
            dayOfMonthOrdinalParse: /\d{1,2}(st|nd|rd|th)/,
            ordinal: function (e) {
              var a = e % 10;
              return e + (1 == ~~((e % 100) / 10) ? 'th' : 1 == a ? 'st' : 2 == a ? 'nd' : 3 == a ? 'rd' : 'th');
            },
            week: { dow: 1, doy: 4 },
          }),
          t.defineLocale('en-ie', {
            months: 'January_February_March_April_May_June_July_August_September_October_November_December'.split('_'),
            monthsShort: 'Jan_Feb_Mar_Apr_May_Jun_Jul_Aug_Sep_Oct_Nov_Dec'.split('_'),
            weekdays: 'Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday'.split('_'),
            weekdaysShort: 'Sun_Mon_Tue_Wed_Thu_Fri_Sat'.split('_'),
            weekdaysMin: 'Su_Mo_Tu_We_Th_Fr_Sa'.split('_'),
            longDateFormat: { LT: 'HH:mm', LTS: 'HH:mm:ss', L: 'DD/MM/YYYY', LL: 'D MMMM YYYY', LLL: 'D MMMM YYYY HH:mm', LLLL: 'dddd D MMMM YYYY HH:mm' },
            calendar: { sameDay: '[Today at] LT', nextDay: '[Tomorrow at] LT', nextWeek: 'dddd [at] LT', lastDay: '[Yesterday at] LT', lastWeek: '[Last] dddd [at] LT', sameElse: 'L' },
            relativeTime: { future: 'in %s', past: '%s ago', s: 'a few seconds', ss: '%d seconds', m: 'a minute', mm: '%d minutes', h: 'an hour', hh: '%d hours', d: 'a day', dd: '%d days', M: 'a month', MM: '%d months', y: 'a year', yy: '%d years' },
            dayOfMonthOrdinalParse: /\d{1,2}(st|nd|rd|th)/,
            ordinal: function (e) {
              var a = e % 10;
              return e + (1 == ~~((e % 100) / 10) ? 'th' : 1 == a ? 'st' : 2 == a ? 'nd' : 3 == a ? 'rd' : 'th');
            },
            week: { dow: 1, doy: 4 },
          }),
          t.defineLocale('en-il', {
            months: 'January_February_March_April_May_June_July_August_September_October_November_December'.split('_'),
            monthsShort: 'Jan_Feb_Mar_Apr_May_Jun_Jul_Aug_Sep_Oct_Nov_Dec'.split('_'),
            weekdays: 'Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday'.split('_'),
            weekdaysShort: 'Sun_Mon_Tue_Wed_Thu_Fri_Sat'.split('_'),
            weekdaysMin: 'Su_Mo_Tu_We_Th_Fr_Sa'.split('_'),
            longDateFormat: { LT: 'HH:mm', LTS: 'HH:mm:ss', L: 'DD/MM/YYYY', LL: 'D MMMM YYYY', LLL: 'D MMMM YYYY HH:mm', LLLL: 'dddd, D MMMM YYYY HH:mm' },
            calendar: { sameDay: '[Today at] LT', nextDay: '[Tomorrow at] LT', nextWeek: 'dddd [at] LT', lastDay: '[Yesterday at] LT', lastWeek: '[Last] dddd [at] LT', sameElse: 'L' },
            relativeTime: { future: 'in %s', past: '%s ago', s: 'a few seconds', ss: '%d seconds', m: 'a minute', mm: '%d minutes', h: 'an hour', hh: '%d hours', d: 'a day', dd: '%d days', M: 'a month', MM: '%d months', y: 'a year', yy: '%d years' },
            dayOfMonthOrdinalParse: /\d{1,2}(st|nd|rd|th)/,
            ordinal: function (e) {
              var a = e % 10;
              return e + (1 == ~~((e % 100) / 10) ? 'th' : 1 == a ? 'st' : 2 == a ? 'nd' : 3 == a ? 'rd' : 'th');
            },
          }),
          t.defineLocale('en-in', {
            months: 'January_February_March_April_May_June_July_August_September_October_November_December'.split('_'),
            monthsShort: 'Jan_Feb_Mar_Apr_May_Jun_Jul_Aug_Sep_Oct_Nov_Dec'.split('_'),
            weekdays: 'Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday'.split('_'),
            weekdaysShort: 'Sun_Mon_Tue_Wed_Thu_Fri_Sat'.split('_'),
            weekdaysMin: 'Su_Mo_Tu_We_Th_Fr_Sa'.split('_'),
            longDateFormat: { LT: 'h:mm A', LTS: 'h:mm:ss A', L: 'DD/MM/YYYY', LL: 'D MMMM YYYY', LLL: 'D MMMM YYYY h:mm A', LLLL: 'dddd, D MMMM YYYY h:mm A' },
            calendar: { sameDay: '[Today at] LT', nextDay: '[Tomorrow at] LT', nextWeek: 'dddd [at] LT', lastDay: '[Yesterday at] LT', lastWeek: '[Last] dddd [at] LT', sameElse: 'L' },
            relativeTime: { future: 'in %s', past: '%s ago', s: 'a few seconds', ss: '%d seconds', m: 'a minute', mm: '%d minutes', h: 'an hour', hh: '%d hours', d: 'a day', dd: '%d days', M: 'a month', MM: '%d months', y: 'a year', yy: '%d years' },
            dayOfMonthOrdinalParse: /\d{1,2}(st|nd|rd|th)/,
            ordinal: function (e) {
              var a = e % 10;
              return e + (1 == ~~((e % 100) / 10) ? 'th' : 1 == a ? 'st' : 2 == a ? 'nd' : 3 == a ? 'rd' : 'th');
            },
            week: { dow: 0, doy: 6 },
          }),
          t.defineLocale('en-nz', {
            months: 'January_February_March_April_May_June_July_August_September_October_November_December'.split('_'),
            monthsShort: 'Jan_Feb_Mar_Apr_May_Jun_Jul_Aug_Sep_Oct_Nov_Dec'.split('_'),
            weekdays: 'Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday'.split('_'),
            weekdaysShort: 'Sun_Mon_Tue_Wed_Thu_Fri_Sat'.split('_'),
            weekdaysMin: 'Su_Mo_Tu_We_Th_Fr_Sa'.split('_'),
            longDateFormat: { LT: 'h:mm A', LTS: 'h:mm:ss A', L: 'DD/MM/YYYY', LL: 'D MMMM YYYY', LLL: 'D MMMM YYYY h:mm A', LLLL: 'dddd, D MMMM YYYY h:mm A' },
            calendar: { sameDay: '[Today at] LT', nextDay: '[Tomorrow at] LT', nextWeek: 'dddd [at] LT', lastDay: '[Yesterday at] LT', lastWeek: '[Last] dddd [at] LT', sameElse: 'L' },
            relativeTime: { future: 'in %s', past: '%s ago', s: 'a few seconds', ss: '%d seconds', m: 'a minute', mm: '%d minutes', h: 'an hour', hh: '%d hours', d: 'a day', dd: '%d days', M: 'a month', MM: '%d months', y: 'a year', yy: '%d years' },
            dayOfMonthOrdinalParse: /\d{1,2}(st|nd|rd|th)/,
            ordinal: function (e) {
              var a = e % 10;
              return e + (1 == ~~((e % 100) / 10) ? 'th' : 1 == a ? 'st' : 2 == a ? 'nd' : 3 == a ? 'rd' : 'th');
            },
            week: { dow: 1, doy: 4 },
          }),
          t.defineLocale('en-sg', {
            months: 'January_February_March_April_May_June_July_August_September_October_November_December'.split('_'),
            monthsShort: 'Jan_Feb_Mar_Apr_May_Jun_Jul_Aug_Sep_Oct_Nov_Dec'.split('_'),
            weekdays: 'Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday'.split('_'),
            weekdaysShort: 'Sun_Mon_Tue_Wed_Thu_Fri_Sat'.split('_'),
            weekdaysMin: 'Su_Mo_Tu_We_Th_Fr_Sa'.split('_'),
            longDateFormat: { LT: 'HH:mm', LTS: 'HH:mm:ss', L: 'DD/MM/YYYY', LL: 'D MMMM YYYY', LLL: 'D MMMM YYYY HH:mm', LLLL: 'dddd, D MMMM YYYY HH:mm' },
            calendar: { sameDay: '[Today at] LT', nextDay: '[Tomorrow at] LT', nextWeek: 'dddd [at] LT', lastDay: '[Yesterday at] LT', lastWeek: '[Last] dddd [at] LT', sameElse: 'L' },
            relativeTime: { future: 'in %s', past: '%s ago', s: 'a few seconds', ss: '%d seconds', m: 'a minute', mm: '%d minutes', h: 'an hour', hh: '%d hours', d: 'a day', dd: '%d days', M: 'a month', MM: '%d months', y: 'a year', yy: '%d years' },
            dayOfMonthOrdinalParse: /\d{1,2}(st|nd|rd|th)/,
            ordinal: function (e) {
              var a = e % 10;
              return e + (1 == ~~((e % 100) / 10) ? 'th' : 1 == a ? 'st' : 2 == a ? 'nd' : 3 == a ? 'rd' : 'th');
            },
            week: { dow: 1, doy: 4 },
          }),
          t.defineLocale('eo', {
            months: 'januaro_februaro_marto_aprilo_majo_junio_julio_aŭgusto_septembro_oktobro_novembro_decembro'.split('_'),
            monthsShort: 'jan_feb_mart_apr_maj_jun_jul_aŭg_sept_okt_nov_dec'.split('_'),
            weekdays: 'dimanĉo_lundo_mardo_merkredo_ĵaŭdo_vendredo_sabato'.split('_'),
            weekdaysShort: 'dim_lun_mard_merk_ĵaŭ_ven_sab'.split('_'),
            weekdaysMin: 'di_lu_ma_me_ĵa_ve_sa'.split('_'),
            longDateFormat: { LT: 'HH:mm', LTS: 'HH:mm:ss', L: 'YYYY-MM-DD', LL: '[la] D[-an de] MMMM, YYYY', LLL: '[la] D[-an de] MMMM, YYYY HH:mm', LLLL: 'dddd[n], [la] D[-an de] MMMM, YYYY HH:mm', llll: 'ddd, [la] D[-an de] MMM, YYYY HH:mm' },
            meridiemParse: /[ap]\.t\.m/i,
            isPM: function (e) {
              return 'p' === e.charAt(0).toLowerCase();
            },
            meridiem: function (e, a, t) {
              return 11 < e ? (t ? 'p.t.m.' : 'P.T.M.') : t ? 'a.t.m.' : 'A.T.M.';
            },
            calendar: { sameDay: '[Hodiaŭ je] LT', nextDay: '[Morgaŭ je] LT', nextWeek: 'dddd[n je] LT', lastDay: '[Hieraŭ je] LT', lastWeek: '[pasintan] dddd[n je] LT', sameElse: 'L' },
            relativeTime: { future: 'post %s', past: 'antaŭ %s', s: 'kelkaj sekundoj', ss: '%d sekundoj', m: 'unu minuto', mm: '%d minutoj', h: 'unu horo', hh: '%d horoj', d: 'unu tago', dd: '%d tagoj', M: 'unu monato', MM: '%d monatoj', y: 'unu jaro', yy: '%d jaroj' },
            dayOfMonthOrdinalParse: /\d{1,2}a/,
            ordinal: '%da',
            week: { dow: 1, doy: 7 },
          });
        var Rs = 'ene._feb._mar._abr._may._jun._jul._ago._sep._oct._nov._dic.'.split('_'),
          Cs = 'ene_feb_mar_abr_may_jun_jul_ago_sep_oct_nov_dic'.split('_'),
          Is = [/^ene/i, /^feb/i, /^mar/i, /^abr/i, /^may/i, /^jun/i, /^jul/i, /^ago/i, /^sep/i, /^oct/i, /^nov/i, /^dic/i],
          Us = /^(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre|ene\.?|feb\.?|mar\.?|abr\.?|may\.?|jun\.?|jul\.?|ago\.?|sep\.?|oct\.?|nov\.?|dic\.?)/i;
        t.defineLocale('es-do', {
          months: 'enero_febrero_marzo_abril_mayo_junio_julio_agosto_septiembre_octubre_noviembre_diciembre'.split('_'),
          monthsShort: function (e, a) {
            return e ? (/-MMM-/.test(a) ? Cs[e.month()] : Rs[e.month()]) : Rs;
          },
          monthsRegex: Us,
          monthsShortRegex: Us,
          monthsStrictRegex: /^(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)/i,
          monthsShortStrictRegex: /^(ene\.?|feb\.?|mar\.?|abr\.?|may\.?|jun\.?|jul\.?|ago\.?|sep\.?|oct\.?|nov\.?|dic\.?)/i,
          monthsParse: Is,
          longMonthsParse: Is,
          shortMonthsParse: Is,
          weekdays: 'domingo_lunes_martes_miércoles_jueves_viernes_sábado'.split('_'),
          weekdaysShort: 'dom._lun._mar._mié._jue._vie._sáb.'.split('_'),
          weekdaysMin: 'do_lu_ma_mi_ju_vi_sá'.split('_'),
          weekdaysParseExact: !0,
          longDateFormat: { LT: 'h:mm A', LTS: 'h:mm:ss A', L: 'DD/MM/YYYY', LL: 'D [de] MMMM [de] YYYY', LLL: 'D [de] MMMM [de] YYYY h:mm A', LLLL: 'dddd, D [de] MMMM [de] YYYY h:mm A' },
          calendar: {
            sameDay: function () {
              return '[hoy a la' + (1 !== this.hours() ? 's' : '') + '] LT';
            },
            nextDay: function () {
              return '[mañana a la' + (1 !== this.hours() ? 's' : '') + '] LT';
            },
            nextWeek: function () {
              return 'dddd [a la' + (1 !== this.hours() ? 's' : '') + '] LT';
            },
            lastDay: function () {
              return '[ayer a la' + (1 !== this.hours() ? 's' : '') + '] LT';
            },
            lastWeek: function () {
              return '[el] dddd [pasado a la' + (1 !== this.hours() ? 's' : '') + '] LT';
            },
            sameElse: 'L',
          },
          relativeTime: { future: 'en %s', past: 'hace %s', s: 'unos segundos', ss: '%d segundos', m: 'un minuto', mm: '%d minutos', h: 'una hora', hh: '%d horas', d: 'un día', dd: '%d días', w: 'una semana', ww: '%d semanas', M: 'un mes', MM: '%d meses', y: 'un año', yy: '%d años' },
          dayOfMonthOrdinalParse: /\d{1,2}\xba/,
          ordinal: '%dº',
          week: { dow: 1, doy: 4 },
        });
        var Gs = 'ene._feb._mar._abr._may._jun._jul._ago._sep._oct._nov._dic.'.split('_'),
          Vs = 'ene_feb_mar_abr_may_jun_jul_ago_sep_oct_nov_dic'.split('_'),
          Bs = [/^ene/i, /^feb/i, /^mar/i, /^abr/i, /^may/i, /^jun/i, /^jul/i, /^ago/i, /^sep/i, /^oct/i, /^nov/i, /^dic/i],
          Ks = /^(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre|ene\.?|feb\.?|mar\.?|abr\.?|may\.?|jun\.?|jul\.?|ago\.?|sep\.?|oct\.?|nov\.?|dic\.?)/i;
        t.defineLocale('es-mx', {
          months: 'enero_febrero_marzo_abril_mayo_junio_julio_agosto_septiembre_octubre_noviembre_diciembre'.split('_'),
          monthsShort: function (e, a) {
            return e ? (/-MMM-/.test(a) ? Vs[e.month()] : Gs[e.month()]) : Gs;
          },
          monthsRegex: Ks,
          monthsShortRegex: Ks,
          monthsStrictRegex: /^(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)/i,
          monthsShortStrictRegex: /^(ene\.?|feb\.?|mar\.?|abr\.?|may\.?|jun\.?|jul\.?|ago\.?|sep\.?|oct\.?|nov\.?|dic\.?)/i,
          monthsParse: Bs,
          longMonthsParse: Bs,
          shortMonthsParse: Bs,
          weekdays: 'domingo_lunes_martes_miércoles_jueves_viernes_sábado'.split('_'),
          weekdaysShort: 'dom._lun._mar._mié._jue._vie._sáb.'.split('_'),
          weekdaysMin: 'do_lu_ma_mi_ju_vi_sá'.split('_'),
          weekdaysParseExact: !0,
          longDateFormat: { LT: 'H:mm', LTS: 'H:mm:ss', L: 'DD/MM/YYYY', LL: 'D [de] MMMM [de] YYYY', LLL: 'D [de] MMMM [de] YYYY H:mm', LLLL: 'dddd, D [de] MMMM [de] YYYY H:mm' },
          calendar: {
            sameDay: function () {
              return '[hoy a la' + (1 !== this.hours() ? 's' : '') + '] LT';
            },
            nextDay: function () {
              return '[mañana a la' + (1 !== this.hours() ? 's' : '') + '] LT';
            },
            nextWeek: function () {
              return 'dddd [a la' + (1 !== this.hours() ? 's' : '') + '] LT';
            },
            lastDay: function () {
              return '[ayer a la' + (1 !== this.hours() ? 's' : '') + '] LT';
            },
            lastWeek: function () {
              return '[el] dddd [pasado a la' + (1 !== this.hours() ? 's' : '') + '] LT';
            },
            sameElse: 'L',
          },
          relativeTime: { future: 'en %s', past: 'hace %s', s: 'unos segundos', ss: '%d segundos', m: 'un minuto', mm: '%d minutos', h: 'una hora', hh: '%d horas', d: 'un día', dd: '%d días', w: 'una semana', ww: '%d semanas', M: 'un mes', MM: '%d meses', y: 'un año', yy: '%d años' },
          dayOfMonthOrdinalParse: /\d{1,2}\xba/,
          ordinal: '%dº',
          week: { dow: 0, doy: 4 },
          invalidDate: 'Fecha inválida',
        });
        var qs = 'ene._feb._mar._abr._may._jun._jul._ago._sep._oct._nov._dic.'.split('_'),
          Zs = 'ene_feb_mar_abr_may_jun_jul_ago_sep_oct_nov_dic'.split('_'),
          $s = [/^ene/i, /^feb/i, /^mar/i, /^abr/i, /^may/i, /^jun/i, /^jul/i, /^ago/i, /^sep/i, /^oct/i, /^nov/i, /^dic/i],
          Qs = /^(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre|ene\.?|feb\.?|mar\.?|abr\.?|may\.?|jun\.?|jul\.?|ago\.?|sep\.?|oct\.?|nov\.?|dic\.?)/i;
        t.defineLocale('es-us', {
          months: 'enero_febrero_marzo_abril_mayo_junio_julio_agosto_septiembre_octubre_noviembre_diciembre'.split('_'),
          monthsShort: function (e, a) {
            return e ? (/-MMM-/.test(a) ? Zs[e.month()] : qs[e.month()]) : qs;
          },
          monthsRegex: Qs,
          monthsShortRegex: Qs,
          monthsStrictRegex: /^(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)/i,
          monthsShortStrictRegex: /^(ene\.?|feb\.?|mar\.?|abr\.?|may\.?|jun\.?|jul\.?|ago\.?|sep\.?|oct\.?|nov\.?|dic\.?)/i,
          monthsParse: $s,
          longMonthsParse: $s,
          shortMonthsParse: $s,
          weekdays: 'domingo_lunes_martes_miércoles_jueves_viernes_sábado'.split('_'),
          weekdaysShort: 'dom._lun._mar._mié._jue._vie._sáb.'.split('_'),
          weekdaysMin: 'do_lu_ma_mi_ju_vi_sá'.split('_'),
          weekdaysParseExact: !0,
          longDateFormat: { LT: 'h:mm A', LTS: 'h:mm:ss A', L: 'MM/DD/YYYY', LL: 'D [de] MMMM [de] YYYY', LLL: 'D [de] MMMM [de] YYYY h:mm A', LLLL: 'dddd, D [de] MMMM [de] YYYY h:mm A' },
          calendar: {
            sameDay: function () {
              return '[hoy a la' + (1 !== this.hours() ? 's' : '') + '] LT';
            },
            nextDay: function () {
              return '[mañana a la' + (1 !== this.hours() ? 's' : '') + '] LT';
            },
            nextWeek: function () {
              return 'dddd [a la' + (1 !== this.hours() ? 's' : '') + '] LT';
            },
            lastDay: function () {
              return '[ayer a la' + (1 !== this.hours() ? 's' : '') + '] LT';
            },
            lastWeek: function () {
              return '[el] dddd [pasado a la' + (1 !== this.hours() ? 's' : '') + '] LT';
            },
            sameElse: 'L',
          },
          relativeTime: { future: 'en %s', past: 'hace %s', s: 'unos segundos', ss: '%d segundos', m: 'un minuto', mm: '%d minutos', h: 'una hora', hh: '%d horas', d: 'un día', dd: '%d días', w: 'una semana', ww: '%d semanas', M: 'un mes', MM: '%d meses', y: 'un año', yy: '%d años' },
          dayOfMonthOrdinalParse: /\d{1,2}\xba/,
          ordinal: '%dº',
          week: { dow: 0, doy: 6 },
        });
        var Xs = 'ene._feb._mar._abr._may._jun._jul._ago._sep._oct._nov._dic.'.split('_'),
          en = 'ene_feb_mar_abr_may_jun_jul_ago_sep_oct_nov_dic'.split('_'),
          an = [/^ene/i, /^feb/i, /^mar/i, /^abr/i, /^may/i, /^jun/i, /^jul/i, /^ago/i, /^sep/i, /^oct/i, /^nov/i, /^dic/i],
          tn = /^(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre|ene\.?|feb\.?|mar\.?|abr\.?|may\.?|jun\.?|jul\.?|ago\.?|sep\.?|oct\.?|nov\.?|dic\.?)/i;
        function sn(e, a, t, s) {
          var n = {
            s: ['mõne sekundi', 'mõni sekund', 'paar sekundit'],
            ss: [e + 'sekundi', e + 'sekundit'],
            m: ['ühe minuti', 'üks minut'],
            mm: [e + ' minuti', e + ' minutit'],
            h: ['ühe tunni', 'tund aega', 'üks tund'],
            hh: [e + ' tunni', e + ' tundi'],
            d: ['ühe päeva', 'üks päev'],
            M: ['kuu aja', 'kuu aega', 'üks kuu'],
            MM: [e + ' kuu', e + ' kuud'],
            y: ['ühe aasta', 'aasta', 'üks aasta'],
            yy: [e + ' aasta', e + ' aastat'],
          };
          return a ? (n[t][2] ? n[t][2] : n[t][1]) : s ? n[t][0] : n[t][1];
        }
        t.defineLocale('es', {
          months: 'enero_febrero_marzo_abril_mayo_junio_julio_agosto_septiembre_octubre_noviembre_diciembre'.split('_'),
          monthsShort: function (e, a) {
            return e ? (/-MMM-/.test(a) ? en[e.month()] : Xs[e.month()]) : Xs;
          },
          monthsRegex: tn,
          monthsShortRegex: tn,
          monthsStrictRegex: /^(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)/i,
          monthsShortStrictRegex: /^(ene\.?|feb\.?|mar\.?|abr\.?|may\.?|jun\.?|jul\.?|ago\.?|sep\.?|oct\.?|nov\.?|dic\.?)/i,
          monthsParse: an,
          longMonthsParse: an,
          shortMonthsParse: an,
          weekdays: 'domingo_lunes_martes_miércoles_jueves_viernes_sábado'.split('_'),
          weekdaysShort: 'dom._lun._mar._mié._jue._vie._sáb.'.split('_'),
          weekdaysMin: 'do_lu_ma_mi_ju_vi_sá'.split('_'),
          weekdaysParseExact: !0,
          longDateFormat: { LT: 'H:mm', LTS: 'H:mm:ss', L: 'DD/MM/YYYY', LL: 'D [de] MMMM [de] YYYY', LLL: 'D [de] MMMM [de] YYYY H:mm', LLLL: 'dddd, D [de] MMMM [de] YYYY H:mm' },
          calendar: {
            sameDay: function () {
              return '[hoy a la' + (1 !== this.hours() ? 's' : '') + '] LT';
            },
            nextDay: function () {
              return '[mañana a la' + (1 !== this.hours() ? 's' : '') + '] LT';
            },
            nextWeek: function () {
              return 'dddd [a la' + (1 !== this.hours() ? 's' : '') + '] LT';
            },
            lastDay: function () {
              return '[ayer a la' + (1 !== this.hours() ? 's' : '') + '] LT';
            },
            lastWeek: function () {
              return '[el] dddd [pasado a la' + (1 !== this.hours() ? 's' : '') + '] LT';
            },
            sameElse: 'L',
          },
          relativeTime: { future: 'en %s', past: 'hace %s', s: 'unos segundos', ss: '%d segundos', m: 'un minuto', mm: '%d minutos', h: 'una hora', hh: '%d horas', d: 'un día', dd: '%d días', w: 'una semana', ww: '%d semanas', M: 'un mes', MM: '%d meses', y: 'un año', yy: '%d años' },
          dayOfMonthOrdinalParse: /\d{1,2}\xba/,
          ordinal: '%dº',
          week: { dow: 1, doy: 4 },
          invalidDate: 'Fecha inválida',
        }),
          t.defineLocale('et', {
            months: 'jaanuar_veebruar_märts_aprill_mai_juuni_juuli_august_september_oktoober_november_detsember'.split('_'),
            monthsShort: 'jaan_veebr_märts_apr_mai_juuni_juuli_aug_sept_okt_nov_dets'.split('_'),
            weekdays: 'pühapäev_esmaspäev_teisipäev_kolmapäev_neljapäev_reede_laupäev'.split('_'),
            weekdaysShort: 'P_E_T_K_N_R_L'.split('_'),
            weekdaysMin: 'P_E_T_K_N_R_L'.split('_'),
            longDateFormat: { LT: 'H:mm', LTS: 'H:mm:ss', L: 'DD.MM.YYYY', LL: 'D. MMMM YYYY', LLL: 'D. MMMM YYYY H:mm', LLLL: 'dddd, D. MMMM YYYY H:mm' },
            calendar: { sameDay: '[Täna,] LT', nextDay: '[Homme,] LT', nextWeek: '[Järgmine] dddd LT', lastDay: '[Eile,] LT', lastWeek: '[Eelmine] dddd LT', sameElse: 'L' },
            relativeTime: { future: '%s pärast', past: '%s tagasi', s: sn, ss: sn, m: sn, mm: sn, h: sn, hh: sn, d: sn, dd: '%d päeva', M: sn, MM: sn, y: sn, yy: sn },
            dayOfMonthOrdinalParse: /\d{1,2}\./,
            ordinal: '%d.',
            week: { dow: 1, doy: 4 },
          }),
          t.defineLocale('eu', {
            months: 'urtarrila_otsaila_martxoa_apirila_maiatza_ekaina_uztaila_abuztua_iraila_urria_azaroa_abendua'.split('_'),
            monthsShort: 'urt._ots._mar._api._mai._eka._uzt._abu._ira._urr._aza._abe.'.split('_'),
            monthsParseExact: !0,
            weekdays: 'igandea_astelehena_asteartea_asteazkena_osteguna_ostirala_larunbata'.split('_'),
            weekdaysShort: 'ig._al._ar._az._og._ol._lr.'.split('_'),
            weekdaysMin: 'ig_al_ar_az_og_ol_lr'.split('_'),
            weekdaysParseExact: !0,
            longDateFormat: {
              LT: 'HH:mm',
              LTS: 'HH:mm:ss',
              L: 'YYYY-MM-DD',
              LL: 'YYYY[ko] MMMM[ren] D[a]',
              LLL: 'YYYY[ko] MMMM[ren] D[a] HH:mm',
              LLLL: 'dddd, YYYY[ko] MMMM[ren] D[a] HH:mm',
              l: 'YYYY-M-D',
              ll: 'YYYY[ko] MMM D[a]',
              lll: 'YYYY[ko] MMM D[a] HH:mm',
              llll: 'ddd, YYYY[ko] MMM D[a] HH:mm',
            },
            calendar: { sameDay: '[gaur] LT[etan]', nextDay: '[bihar] LT[etan]', nextWeek: 'dddd LT[etan]', lastDay: '[atzo] LT[etan]', lastWeek: '[aurreko] dddd LT[etan]', sameElse: 'L' },
            relativeTime: { future: '%s barru', past: 'duela %s', s: 'segundo batzuk', ss: '%d segundo', m: 'minutu bat', mm: '%d minutu', h: 'ordu bat', hh: '%d ordu', d: 'egun bat', dd: '%d egun', M: 'hilabete bat', MM: '%d hilabete', y: 'urte bat', yy: '%d urte' },
            dayOfMonthOrdinalParse: /\d{1,2}\./,
            ordinal: '%d.',
            week: { dow: 1, doy: 7 },
          });
        var nn = { 1: '۱', 2: '۲', 3: '۳', 4: '۴', 5: '۵', 6: '۶', 7: '۷', 8: '۸', 9: '۹', 0: '۰' },
          dn = { '۱': '1', '۲': '2', '۳': '3', '۴': '4', '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9', '۰': '0' };
        t.defineLocale('fa', {
          months: 'ژانویه_فوریه_مارس_آوریل_مه_ژوئن_ژوئیه_اوت_سپتامبر_اکتبر_نوامبر_دسامبر'.split('_'),
          monthsShort: 'ژانویه_فوریه_مارس_آوریل_مه_ژوئن_ژوئیه_اوت_سپتامبر_اکتبر_نوامبر_دسامبر'.split('_'),
          weekdays: 'یک‌شنبه_دوشنبه_سه‌شنبه_چهارشنبه_پنج‌شنبه_جمعه_شنبه'.split('_'),
          weekdaysShort: 'یک‌شنبه_دوشنبه_سه‌شنبه_چهارشنبه_پنج‌شنبه_جمعه_شنبه'.split('_'),
          weekdaysMin: 'ی_د_س_چ_پ_ج_ش'.split('_'),
          weekdaysParseExact: !0,
          longDateFormat: { LT: 'HH:mm', LTS: 'HH:mm:ss', L: 'DD/MM/YYYY', LL: 'D MMMM YYYY', LLL: 'D MMMM YYYY HH:mm', LLLL: 'dddd, D MMMM YYYY HH:mm' },
          meridiemParse: /\u0642\u0628\u0644 \u0627\u0632 \u0638\u0647\u0631|\u0628\u0639\u062f \u0627\u0632 \u0638\u0647\u0631/,
          isPM: function (e) {
            return /\u0628\u0639\u062f \u0627\u0632 \u0638\u0647\u0631/.test(e);
          },
          meridiem: function (e, a, t) {
            return e < 12 ? 'قبل از ظهر' : 'بعد از ظهر';
          },
          calendar: { sameDay: '[امروز ساعت] LT', nextDay: '[فردا ساعت] LT', nextWeek: 'dddd [ساعت] LT', lastDay: '[دیروز ساعت] LT', lastWeek: 'dddd [پیش] [ساعت] LT', sameElse: 'L' },
          relativeTime: { future: 'در %s', past: '%s پیش', s: 'چند ثانیه', ss: '%d ثانیه', m: 'یک دقیقه', mm: '%d دقیقه', h: 'یک ساعت', hh: '%d ساعت', d: 'یک روز', dd: '%d روز', M: 'یک ماه', MM: '%d ماه', y: 'یک سال', yy: '%d سال' },
          preparse: function (e) {
            return e
              .replace(/[\u06f0-\u06f9]/g, function (e) {
                return dn[e];
              })
              .replace(/\u060c/g, ',');
          },
          postformat: function (e) {
            return e
              .replace(/\d/g, function (e) {
                return nn[e];
              })
              .replace(/,/g, '،');
          },
          dayOfMonthOrdinalParse: /\d{1,2}\u0645/,
          ordinal: '%dم',
          week: { dow: 6, doy: 12 },
        });
        var rn = 'nolla yksi kaksi kolme neljä viisi kuusi seitsemän kahdeksan yhdeksän'.split(' '),
          un = ['nolla', 'yhden', 'kahden', 'kolmen', 'neljän', 'viiden', 'kuuden', rn[7], rn[8], rn[9]];
        function _n(e, a, t, s) {
          var n,
            d,
            r = '';
          switch (t) {
            case 's':
              return s ? 'muutaman sekunnin' : 'muutama sekunti';
            case 'ss':
              r = s ? 'sekunnin' : 'sekuntia';
              break;
            case 'm':
              return s ? 'minuutin' : 'minuutti';
            case 'mm':
              r = s ? 'minuutin' : 'minuuttia';
              break;
            case 'h':
              return s ? 'tunnin' : 'tunti';
            case 'hh':
              r = s ? 'tunnin' : 'tuntia';
              break;
            case 'd':
              return s ? 'päivän' : 'päivä';
            case 'dd':
              r = s ? 'päivän' : 'päivää';
              break;
            case 'M':
              return s ? 'kuukauden' : 'kuukausi';
            case 'MM':
              r = s ? 'kuukauden' : 'kuukautta';
              break;
            case 'y':
              return s ? 'vuoden' : 'vuosi';
            case 'yy':
              r = s ? 'vuoden' : 'vuotta';
              break;
          }
          return (d = s), (r = ((n = e) < 10 ? (d ? un[n] : rn[n]) : n) + ' ' + r);
        }
        t.defineLocale('fi', {
          months: 'tammikuu_helmikuu_maaliskuu_huhtikuu_toukokuu_kesäkuu_heinäkuu_elokuu_syyskuu_lokakuu_marraskuu_joulukuu'.split('_'),
          monthsShort: 'tammi_helmi_maalis_huhti_touko_kesä_heinä_elo_syys_loka_marras_joulu'.split('_'),
          weekdays: 'sunnuntai_maanantai_tiistai_keskiviikko_torstai_perjantai_lauantai'.split('_'),
          weekdaysShort: 'su_ma_ti_ke_to_pe_la'.split('_'),
          weekdaysMin: 'su_ma_ti_ke_to_pe_la'.split('_'),
          longDateFormat: { LT: 'HH.mm', LTS: 'HH.mm.ss', L: 'DD.MM.YYYY', LL: 'Do MMMM[ta] YYYY', LLL: 'Do MMMM[ta] YYYY, [klo] HH.mm', LLLL: 'dddd, Do MMMM[ta] YYYY, [klo] HH.mm', l: 'D.M.YYYY', ll: 'Do MMM YYYY', lll: 'Do MMM YYYY, [klo] HH.mm', llll: 'ddd, Do MMM YYYY, [klo] HH.mm' },
          calendar: { sameDay: '[tänään] [klo] LT', nextDay: '[huomenna] [klo] LT', nextWeek: 'dddd [klo] LT', lastDay: '[eilen] [klo] LT', lastWeek: '[viime] dddd[na] [klo] LT', sameElse: 'L' },
          relativeTime: { future: '%s päästä', past: '%s sitten', s: _n, ss: _n, m: _n, mm: _n, h: _n, hh: _n, d: _n, dd: _n, M: _n, MM: _n, y: _n, yy: _n },
          dayOfMonthOrdinalParse: /\d{1,2}\./,
          ordinal: '%d.',
          week: { dow: 1, doy: 4 },
        }),
          t.defineLocale('fil', {
            months: 'Enero_Pebrero_Marso_Abril_Mayo_Hunyo_Hulyo_Agosto_Setyembre_Oktubre_Nobyembre_Disyembre'.split('_'),
            monthsShort: 'Ene_Peb_Mar_Abr_May_Hun_Hul_Ago_Set_Okt_Nob_Dis'.split('_'),
            weekdays: 'Linggo_Lunes_Martes_Miyerkules_Huwebes_Biyernes_Sabado'.split('_'),
            weekdaysShort: 'Lin_Lun_Mar_Miy_Huw_Biy_Sab'.split('_'),
            weekdaysMin: 'Li_Lu_Ma_Mi_Hu_Bi_Sab'.split('_'),
            longDateFormat: { LT: 'HH:mm', LTS: 'HH:mm:ss', L: 'MM/D/YYYY', LL: 'MMMM D, YYYY', LLL: 'MMMM D, YYYY HH:mm', LLLL: 'dddd, MMMM DD, YYYY HH:mm' },
            calendar: { sameDay: 'LT [ngayong araw]', nextDay: '[Bukas ng] LT', nextWeek: 'LT [sa susunod na] dddd', lastDay: 'LT [kahapon]', lastWeek: 'LT [noong nakaraang] dddd', sameElse: 'L' },
            relativeTime: { future: 'sa loob ng %s', past: '%s ang nakalipas', s: 'ilang segundo', ss: '%d segundo', m: 'isang minuto', mm: '%d minuto', h: 'isang oras', hh: '%d oras', d: 'isang araw', dd: '%d araw', M: 'isang buwan', MM: '%d buwan', y: 'isang taon', yy: '%d taon' },
            dayOfMonthOrdinalParse: /\d{1,2}/,
            ordinal: function (e) {
              return e;
            },
            week: { dow: 1, doy: 4 },
          }),
          t.defineLocale('fo', {
            months: 'januar_februar_mars_apríl_mai_juni_juli_august_september_oktober_november_desember'.split('_'),
            monthsShort: 'jan_feb_mar_apr_mai_jun_jul_aug_sep_okt_nov_des'.split('_'),
            weekdays: 'sunnudagur_mánadagur_týsdagur_mikudagur_hósdagur_fríggjadagur_leygardagur'.split('_'),
            weekdaysShort: 'sun_mán_týs_mik_hós_frí_ley'.split('_'),
            weekdaysMin: 'su_má_tý_mi_hó_fr_le'.split('_'),
            longDateFormat: { LT: 'HH:mm', LTS: 'HH:mm:ss', L: 'DD/MM/YYYY', LL: 'D MMMM YYYY', LLL: 'D MMMM YYYY HH:mm', LLLL: 'dddd D. MMMM, YYYY HH:mm' },
            calendar: { sameDay: '[Í dag kl.] LT', nextDay: '[Í morgin kl.] LT', nextWeek: 'dddd [kl.] LT', lastDay: '[Í gjár kl.] LT', lastWeek: '[síðstu] dddd [kl] LT', sameElse: 'L' },
            relativeTime: { future: 'um %s', past: '%s síðani', s: 'fá sekund', ss: '%d sekundir', m: 'ein minuttur', mm: '%d minuttir', h: 'ein tími', hh: '%d tímar', d: 'ein dagur', dd: '%d dagar', M: 'ein mánaður', MM: '%d mánaðir', y: 'eitt ár', yy: '%d ár' },
            dayOfMonthOrdinalParse: /\d{1,2}\./,
            ordinal: '%d.',
            week: { dow: 1, doy: 4 },
          }),
          t.defineLocale('fr-ca', {
            months: 'janvier_février_mars_avril_mai_juin_juillet_août_septembre_octobre_novembre_décembre'.split('_'),
            monthsShort: 'janv._févr._mars_avr._mai_juin_juil._août_sept._oct._nov._déc.'.split('_'),
            monthsParseExact: !0,
            weekdays: 'dimanche_lundi_mardi_mercredi_jeudi_vendredi_samedi'.split('_'),
            weekdaysShort: 'dim._lun._mar._mer._jeu._ven._sam.'.split('_'),
            weekdaysMin: 'di_lu_ma_me_je_ve_sa'.split('_'),
            weekdaysParseExact: !0,
            longDateFormat: { LT: 'HH:mm', LTS: 'HH:mm:ss', L: 'YYYY-MM-DD', LL: 'D MMMM YYYY', LLL: 'D MMMM YYYY HH:mm', LLLL: 'dddd D MMMM YYYY HH:mm' },
            calendar: { sameDay: '[Aujourd’hui à] LT', nextDay: '[Demain à] LT', nextWeek: 'dddd [à] LT', lastDay: '[Hier à] LT', lastWeek: 'dddd [dernier à] LT', sameElse: 'L' },
            relativeTime: { future: 'dans %s', past: 'il y a %s', s: 'quelques secondes', ss: '%d secondes', m: 'une minute', mm: '%d minutes', h: 'une heure', hh: '%d heures', d: 'un jour', dd: '%d jours', M: 'un mois', MM: '%d mois', y: 'un an', yy: '%d ans' },
            dayOfMonthOrdinalParse: /\d{1,2}(er|e)/,
            ordinal: function (e, a) {
              switch (a) {
                default:
                case 'M':
                case 'Q':
                case 'D':
                case 'DDD':
                case 'd':
                  return e + (1 === e ? 'er' : 'e');
                case 'w':
                case 'W':
                  return e + (1 === e ? 're' : 'e');
              }
            },
          }),
          t.defineLocale('fr-ch', {
            months: 'janvier_février_mars_avril_mai_juin_juillet_août_septembre_octobre_novembre_décembre'.split('_'),
            monthsShort: 'janv._févr._mars_avr._mai_juin_juil._août_sept._oct._nov._déc.'.split('_'),
            monthsParseExact: !0,
            weekdays: 'dimanche_lundi_mardi_mercredi_jeudi_vendredi_samedi'.split('_'),
            weekdaysShort: 'dim._lun._mar._mer._jeu._ven._sam.'.split('_'),
            weekdaysMin: 'di_lu_ma_me_je_ve_sa'.split('_'),
            weekdaysParseExact: !0,
            longDateFormat: { LT: 'HH:mm', LTS: 'HH:mm:ss', L: 'DD.MM.YYYY', LL: 'D MMMM YYYY', LLL: 'D MMMM YYYY HH:mm', LLLL: 'dddd D MMMM YYYY HH:mm' },
            calendar: { sameDay: '[Aujourd’hui à] LT', nextDay: '[Demain à] LT', nextWeek: 'dddd [à] LT', lastDay: '[Hier à] LT', lastWeek: 'dddd [dernier à] LT', sameElse: 'L' },
            relativeTime: { future: 'dans %s', past: 'il y a %s', s: 'quelques secondes', ss: '%d secondes', m: 'une minute', mm: '%d minutes', h: 'une heure', hh: '%d heures', d: 'un jour', dd: '%d jours', M: 'un mois', MM: '%d mois', y: 'un an', yy: '%d ans' },
            dayOfMonthOrdinalParse: /\d{1,2}(er|e)/,
            ordinal: function (e, a) {
              switch (a) {
                default:
                case 'M':
                case 'Q':
                case 'D':
                case 'DDD':
                case 'd':
                  return e + (1 === e ? 'er' : 'e');
                case 'w':
                case 'W':
                  return e + (1 === e ? 're' : 'e');
              }
            },
            week: { dow: 1, doy: 4 },
          });
        var on = /(janv\.?|f\xe9vr\.?|mars|avr\.?|mai|juin|juil\.?|ao\xfbt|sept\.?|oct\.?|nov\.?|d\xe9c\.?|janvier|f\xe9vrier|mars|avril|mai|juin|juillet|ao\xfbt|septembre|octobre|novembre|d\xe9cembre)/i,
          mn = [/^janv/i, /^f\xe9vr/i, /^mars/i, /^avr/i, /^mai/i, /^juin/i, /^juil/i, /^ao\xfbt/i, /^sept/i, /^oct/i, /^nov/i, /^d\xe9c/i];
        t.defineLocale('fr', {
          months: 'janvier_février_mars_avril_mai_juin_juillet_août_septembre_octobre_novembre_décembre'.split('_'),
          monthsShort: 'janv._févr._mars_avr._mai_juin_juil._août_sept._oct._nov._déc.'.split('_'),
          monthsRegex: on,
          monthsShortRegex: on,
          monthsStrictRegex: /^(janvier|f\xe9vrier|mars|avril|mai|juin|juillet|ao\xfbt|septembre|octobre|novembre|d\xe9cembre)/i,
          monthsShortStrictRegex: /(janv\.?|f\xe9vr\.?|mars|avr\.?|mai|juin|juil\.?|ao\xfbt|sept\.?|oct\.?|nov\.?|d\xe9c\.?)/i,
          monthsParse: mn,
          longMonthsParse: mn,
          shortMonthsParse: mn,
          weekdays: 'dimanche_lundi_mardi_mercredi_jeudi_vendredi_samedi'.split('_'),
          weekdaysShort: 'dim._lun._mar._mer._jeu._ven._sam.'.split('_'),
          weekdaysMin: 'di_lu_ma_me_je_ve_sa'.split('_'),
          weekdaysParseExact: !0,
          longDateFormat: { LT: 'HH:mm', LTS: 'HH:mm:ss', L: 'DD/MM/YYYY', LL: 'D MMMM YYYY', LLL: 'D MMMM YYYY HH:mm', LLLL: 'dddd D MMMM YYYY HH:mm' },
          calendar: { sameDay: '[Aujourd’hui à] LT', nextDay: '[Demain à] LT', nextWeek: 'dddd [à] LT', lastDay: '[Hier à] LT', lastWeek: 'dddd [dernier à] LT', sameElse: 'L' },
          relativeTime: { future: 'dans %s', past: 'il y a %s', s: 'quelques secondes', ss: '%d secondes', m: 'une minute', mm: '%d minutes', h: 'une heure', hh: '%d heures', d: 'un jour', dd: '%d jours', w: 'une semaine', ww: '%d semaines', M: 'un mois', MM: '%d mois', y: 'un an', yy: '%d ans' },
          dayOfMonthOrdinalParse: /\d{1,2}(er|)/,
          ordinal: function (e, a) {
            switch (a) {
              case 'D':
                return e + (1 === e ? 'er' : '');
              default:
              case 'M':
              case 'Q':
              case 'DDD':
              case 'd':
                return e + (1 === e ? 'er' : 'e');
              case 'w':
              case 'W':
                return e + (1 === e ? 're' : 'e');
            }
          },
          week: { dow: 1, doy: 4 },
        });
        var ln = 'jan._feb._mrt._apr._mai_jun._jul._aug._sep._okt._nov._des.'.split('_'),
          Mn = 'jan_feb_mrt_apr_mai_jun_jul_aug_sep_okt_nov_des'.split('_');
        t.defineLocale('fy', {
          months: 'jannewaris_febrewaris_maart_april_maaie_juny_july_augustus_septimber_oktober_novimber_desimber'.split('_'),
          monthsShort: function (e, a) {
            return e ? (/-MMM-/.test(a) ? Mn[e.month()] : ln[e.month()]) : ln;
          },
          monthsParseExact: !0,
          weekdays: 'snein_moandei_tiisdei_woansdei_tongersdei_freed_sneon'.split('_'),
          weekdaysShort: 'si._mo._ti._wo._to._fr._so.'.split('_'),
          weekdaysMin: 'Si_Mo_Ti_Wo_To_Fr_So'.split('_'),
          weekdaysParseExact: !0,
          longDateFormat: { LT: 'HH:mm', LTS: 'HH:mm:ss', L: 'DD-MM-YYYY', LL: 'D MMMM YYYY', LLL: 'D MMMM YYYY HH:mm', LLLL: 'dddd D MMMM YYYY HH:mm' },
          calendar: { sameDay: '[hjoed om] LT', nextDay: '[moarn om] LT', nextWeek: 'dddd [om] LT', lastDay: '[juster om] LT', lastWeek: '[ôfrûne] dddd [om] LT', sameElse: 'L' },
          relativeTime: { future: 'oer %s', past: '%s lyn', s: 'in pear sekonden', ss: '%d sekonden', m: 'ien minút', mm: '%d minuten', h: 'ien oere', hh: '%d oeren', d: 'ien dei', dd: '%d dagen', M: 'ien moanne', MM: '%d moannen', y: 'ien jier', yy: '%d jierren' },
          dayOfMonthOrdinalParse: /\d{1,2}(ste|de)/,
          ordinal: function (e) {
            return e + (1 === e || 8 === e || 20 <= e ? 'ste' : 'de');
          },
          week: { dow: 1, doy: 4 },
        });
        t.defineLocale('ga', {
          months: ['Eanáir', 'Feabhra', 'Márta', 'Aibreán', 'Bealtaine', 'Meitheamh', 'Iúil', 'Lúnasa', 'Meán Fómhair', 'Deireadh Fómhair', 'Samhain', 'Nollaig'],
          monthsShort: ['Ean', 'Feabh', 'Márt', 'Aib', 'Beal', 'Meith', 'Iúil', 'Lún', 'M.F.', 'D.F.', 'Samh', 'Noll'],
          monthsParseExact: !0,
          weekdays: ['Dé Domhnaigh', 'Dé Luain', 'Dé Máirt', 'Dé Céadaoin', 'Déardaoin', 'Dé hAoine', 'Dé Sathairn'],
          weekdaysShort: ['Domh', 'Luan', 'Máirt', 'Céad', 'Déar', 'Aoine', 'Sath'],
          weekdaysMin: ['Do', 'Lu', 'Má', 'Cé', 'Dé', 'A', 'Sa'],
          longDateFormat: { LT: 'HH:mm', LTS: 'HH:mm:ss', L: 'DD/MM/YYYY', LL: 'D MMMM YYYY', LLL: 'D MMMM YYYY HH:mm', LLLL: 'dddd, D MMMM YYYY HH:mm' },
          calendar: { sameDay: '[Inniu ag] LT', nextDay: '[Amárach ag] LT', nextWeek: 'dddd [ag] LT', lastDay: '[Inné ag] LT', lastWeek: 'dddd [seo caite] [ag] LT', sameElse: 'L' },
          relativeTime: { future: 'i %s', past: '%s ó shin', s: 'cúpla soicind', ss: '%d soicind', m: 'nóiméad', mm: '%d nóiméad', h: 'uair an chloig', hh: '%d uair an chloig', d: 'lá', dd: '%d lá', M: 'mí', MM: '%d míonna', y: 'bliain', yy: '%d bliain' },
          dayOfMonthOrdinalParse: /\d{1,2}(d|na|mh)/,
          ordinal: function (e) {
            return e + (1 === e ? 'd' : e % 10 == 2 ? 'na' : 'mh');
          },
          week: { dow: 1, doy: 4 },
        });
        function hn(e, a, t, s) {
          var n = {
            s: ['थोडया सॅकंडांनी', 'थोडे सॅकंड'],
            ss: [e + ' सॅकंडांनी', e + ' सॅकंड'],
            m: ['एका मिणटान', 'एक मिनूट'],
            mm: [e + ' मिणटांनी', e + ' मिणटां'],
            h: ['एका वरान', 'एक वर'],
            hh: [e + ' वरांनी', e + ' वरां'],
            d: ['एका दिसान', 'एक दीस'],
            dd: [e + ' दिसांनी', e + ' दीस'],
            M: ['एका म्हयन्यान', 'एक म्हयनो'],
            MM: [e + ' म्हयन्यानी', e + ' म्हयने'],
            y: ['एका वर्सान', 'एक वर्स'],
            yy: [e + ' वर्सांनी', e + ' वर्सां'],
          };
          return s ? n[t][0] : n[t][1];
        }
        function cn(e, a, t, s) {
          var n = {
            s: ['thoddea sekondamni', 'thodde sekond'],
            ss: [e + ' sekondamni', e + ' sekond'],
            m: ['eka mintan', 'ek minut'],
            mm: [e + ' mintamni', e + ' mintam'],
            h: ['eka voran', 'ek vor'],
            hh: [e + ' voramni', e + ' voram'],
            d: ['eka disan', 'ek dis'],
            dd: [e + ' disamni', e + ' dis'],
            M: ['eka mhoinean', 'ek mhoino'],
            MM: [e + ' mhoineamni', e + ' mhoine'],
            y: ['eka vorsan', 'ek voros'],
            yy: [e + ' vorsamni', e + ' vorsam'],
          };
          return s ? n[t][0] : n[t][1];
        }
        t.defineLocale('gd', {
          months: ['Am Faoilleach', 'An Gearran', 'Am Màrt', 'An Giblean', 'An Cèitean', 'An t-Ògmhios', 'An t-Iuchar', 'An Lùnastal', 'An t-Sultain', 'An Dàmhair', 'An t-Samhain', 'An Dùbhlachd'],
          monthsShort: ['Faoi', 'Gear', 'Màrt', 'Gibl', 'Cèit', 'Ògmh', 'Iuch', 'Lùn', 'Sult', 'Dàmh', 'Samh', 'Dùbh'],
          monthsParseExact: !0,
          weekdays: ['Didòmhnaich', 'Diluain', 'Dimàirt', 'Diciadain', 'Diardaoin', 'Dihaoine', 'Disathairne'],
          weekdaysShort: ['Did', 'Dil', 'Dim', 'Dic', 'Dia', 'Dih', 'Dis'],
          weekdaysMin: ['Dò', 'Lu', 'Mà', 'Ci', 'Ar', 'Ha', 'Sa'],
          longDateFormat: { LT: 'HH:mm', LTS: 'HH:mm:ss', L: 'DD/MM/YYYY', LL: 'D MMMM YYYY', LLL: 'D MMMM YYYY HH:mm', LLLL: 'dddd, D MMMM YYYY HH:mm' },
          calendar: { sameDay: '[An-diugh aig] LT', nextDay: '[A-màireach aig] LT', nextWeek: 'dddd [aig] LT', lastDay: '[An-dè aig] LT', lastWeek: 'dddd [seo chaidh] [aig] LT', sameElse: 'L' },
          relativeTime: { future: 'ann an %s', past: 'bho chionn %s', s: 'beagan diogan', ss: '%d diogan', m: 'mionaid', mm: '%d mionaidean', h: 'uair', hh: '%d uairean', d: 'latha', dd: '%d latha', M: 'mìos', MM: '%d mìosan', y: 'bliadhna', yy: '%d bliadhna' },
          dayOfMonthOrdinalParse: /\d{1,2}(d|na|mh)/,
          ordinal: function (e) {
            return e + (1 === e ? 'd' : e % 10 == 2 ? 'na' : 'mh');
          },
          week: { dow: 1, doy: 4 },
        }),
          t.defineLocale('gl', {
            months: 'xaneiro_febreiro_marzo_abril_maio_xuño_xullo_agosto_setembro_outubro_novembro_decembro'.split('_'),
            monthsShort: 'xan._feb._mar._abr._mai._xuñ._xul._ago._set._out._nov._dec.'.split('_'),
            monthsParseExact: !0,
            weekdays: 'domingo_luns_martes_mércores_xoves_venres_sábado'.split('_'),
            weekdaysShort: 'dom._lun._mar._mér._xov._ven._sáb.'.split('_'),
            weekdaysMin: 'do_lu_ma_mé_xo_ve_sá'.split('_'),
            weekdaysParseExact: !0,
            longDateFormat: { LT: 'H:mm', LTS: 'H:mm:ss', L: 'DD/MM/YYYY', LL: 'D [de] MMMM [de] YYYY', LLL: 'D [de] MMMM [de] YYYY H:mm', LLLL: 'dddd, D [de] MMMM [de] YYYY H:mm' },
            calendar: {
              sameDay: function () {
                return '[hoxe ' + (1 !== this.hours() ? 'ás' : 'á') + '] LT';
              },
              nextDay: function () {
                return '[mañá ' + (1 !== this.hours() ? 'ás' : 'á') + '] LT';
              },
              nextWeek: function () {
                return 'dddd [' + (1 !== this.hours() ? 'ás' : 'a') + '] LT';
              },
              lastDay: function () {
                return '[onte ' + (1 !== this.hours() ? 'á' : 'a') + '] LT';
              },
              lastWeek: function () {
                return '[o] dddd [pasado ' + (1 !== this.hours() ? 'ás' : 'a') + '] LT';
              },
              sameElse: 'L',
            },
            relativeTime: {
              future: function (e) {
                return 0 === e.indexOf('un') ? 'n' + e : 'en ' + e;
              },
              past: 'hai %s',
              s: 'uns segundos',
              ss: '%d segundos',
              m: 'un minuto',
              mm: '%d minutos',
              h: 'unha hora',
              hh: '%d horas',
              d: 'un día',
              dd: '%d días',
              M: 'un mes',
              MM: '%d meses',
              y: 'un ano',
              yy: '%d anos',
            },
            dayOfMonthOrdinalParse: /\d{1,2}\xba/,
            ordinal: '%dº',
            week: { dow: 1, doy: 4 },
          }),
          t.defineLocale('gom-deva', {
            months: {
              standalone: 'जानेवारी_फेब्रुवारी_मार्च_एप्रील_मे_जून_जुलय_ऑगस्ट_सप्टेंबर_ऑक्टोबर_नोव्हेंबर_डिसेंबर'.split('_'),
              format: 'जानेवारीच्या_फेब्रुवारीच्या_मार्चाच्या_एप्रीलाच्या_मेयाच्या_जूनाच्या_जुलयाच्या_ऑगस्टाच्या_सप्टेंबराच्या_ऑक्टोबराच्या_नोव्हेंबराच्या_डिसेंबराच्या'.split('_'),
              isFormat: /MMMM(\s)+D[oD]?/,
            },
            monthsShort: 'जाने._फेब्रु._मार्च_एप्री._मे_जून_जुल._ऑग._सप्टें._ऑक्टो._नोव्हें._डिसें.'.split('_'),
            monthsParseExact: !0,
            weekdays: 'आयतार_सोमार_मंगळार_बुधवार_बिरेस्तार_सुक्रार_शेनवार'.split('_'),
            weekdaysShort: 'आयत._सोम._मंगळ._बुध._ब्रेस्त._सुक्र._शेन.'.split('_'),
            weekdaysMin: 'आ_सो_मं_बु_ब्रे_सु_शे'.split('_'),
            weekdaysParseExact: !0,
            longDateFormat: { LT: 'A h:mm [वाजतां]', LTS: 'A h:mm:ss [वाजतां]', L: 'DD-MM-YYYY', LL: 'D MMMM YYYY', LLL: 'D MMMM YYYY A h:mm [वाजतां]', LLLL: 'dddd, MMMM Do, YYYY, A h:mm [वाजतां]', llll: 'ddd, D MMM YYYY, A h:mm [वाजतां]' },
            calendar: { sameDay: '[आयज] LT', nextDay: '[फाल्यां] LT', nextWeek: '[फुडलो] dddd[,] LT', lastDay: '[काल] LT', lastWeek: '[फाटलो] dddd[,] LT', sameElse: 'L' },
            relativeTime: { future: '%s', past: '%s आदीं', s: hn, ss: hn, m: hn, mm: hn, h: hn, hh: hn, d: hn, dd: hn, M: hn, MM: hn, y: hn, yy: hn },
            dayOfMonthOrdinalParse: /\d{1,2}(\u0935\u0947\u0930)/,
            ordinal: function (e, a) {
              switch (a) {
                case 'D':
                  return e + 'वेर';
                default:
                case 'M':
                case 'Q':
                case 'DDD':
                case 'd':
                case 'w':
                case 'W':
                  return e;
              }
            },
            week: { dow: 0, doy: 3 },
            meridiemParse: /\u0930\u093e\u0924\u0940|\u0938\u0915\u093e\u0933\u0940\u0902|\u0926\u0928\u092a\u093e\u0930\u093e\u0902|\u0938\u093e\u0902\u091c\u0947/,
            meridiemHour: function (e, a) {
              return 12 === e && (e = 0), 'राती' === a ? (e < 4 ? e : e + 12) : 'सकाळीं' === a ? e : 'दनपारां' === a ? (12 < e ? e : e + 12) : 'सांजे' === a ? e + 12 : void 0;
            },
            meridiem: function (e, a, t) {
              return e < 4 ? 'राती' : e < 12 ? 'सकाळीं' : e < 16 ? 'दनपारां' : e < 20 ? 'सांजे' : 'राती';
            },
          }),
          t.defineLocale('gom-latn', {
            months: {
              standalone: 'Janer_Febrer_Mars_Abril_Mai_Jun_Julai_Agost_Setembr_Otubr_Novembr_Dezembr'.split('_'),
              format: 'Janerachea_Febrerachea_Marsachea_Abrilachea_Maiachea_Junachea_Julaiachea_Agostachea_Setembrachea_Otubrachea_Novembrachea_Dezembrachea'.split('_'),
              isFormat: /MMMM(\s)+D[oD]?/,
            },
            monthsShort: 'Jan._Feb._Mars_Abr._Mai_Jun_Jul._Ago._Set._Otu._Nov._Dez.'.split('_'),
            monthsParseExact: !0,
            weekdays: "Aitar_Somar_Mongllar_Budhvar_Birestar_Sukrar_Son'var".split('_'),
            weekdaysShort: 'Ait._Som._Mon._Bud._Bre._Suk._Son.'.split('_'),
            weekdaysMin: 'Ai_Sm_Mo_Bu_Br_Su_Sn'.split('_'),
            weekdaysParseExact: !0,
            longDateFormat: { LT: 'A h:mm [vazta]', LTS: 'A h:mm:ss [vazta]', L: 'DD-MM-YYYY', LL: 'D MMMM YYYY', LLL: 'D MMMM YYYY A h:mm [vazta]', LLLL: 'dddd, MMMM Do, YYYY, A h:mm [vazta]', llll: 'ddd, D MMM YYYY, A h:mm [vazta]' },
            calendar: { sameDay: '[Aiz] LT', nextDay: '[Faleam] LT', nextWeek: '[Fuddlo] dddd[,] LT', lastDay: '[Kal] LT', lastWeek: '[Fattlo] dddd[,] LT', sameElse: 'L' },
            relativeTime: { future: '%s', past: '%s adim', s: cn, ss: cn, m: cn, mm: cn, h: cn, hh: cn, d: cn, dd: cn, M: cn, MM: cn, y: cn, yy: cn },
            dayOfMonthOrdinalParse: /\d{1,2}(er)/,
            ordinal: function (e, a) {
              switch (a) {
                case 'D':
                  return e + 'er';
                default:
                case 'M':
                case 'Q':
                case 'DDD':
                case 'd':
                case 'w':
                case 'W':
                  return e;
              }
            },
            week: { dow: 0, doy: 3 },
            meridiemParse: /rati|sokallim|donparam|sanje/,
            meridiemHour: function (e, a) {
              return 12 === e && (e = 0), 'rati' === a ? (e < 4 ? e : e + 12) : 'sokallim' === a ? e : 'donparam' === a ? (12 < e ? e : e + 12) : 'sanje' === a ? e + 12 : void 0;
            },
            meridiem: function (e, a, t) {
              return e < 4 ? 'rati' : e < 12 ? 'sokallim' : e < 16 ? 'donparam' : e < 20 ? 'sanje' : 'rati';
            },
          });
        var Ln = { 1: '૧', 2: '૨', 3: '૩', 4: '૪', 5: '૫', 6: '૬', 7: '૭', 8: '૮', 9: '૯', 0: '૦' },
          Yn = { '૧': '1', '૨': '2', '૩': '3', '૪': '4', '૫': '5', '૬': '6', '૭': '7', '૮': '8', '૯': '9', '૦': '0' };
        t.defineLocale('gu', {
          months: 'જાન્યુઆરી_ફેબ્રુઆરી_માર્ચ_એપ્રિલ_મે_જૂન_જુલાઈ_ઑગસ્ટ_સપ્ટેમ્બર_ઑક્ટ્બર_નવેમ્બર_ડિસેમ્બર'.split('_'),
          monthsShort: 'જાન્યુ._ફેબ્રુ._માર્ચ_એપ્રિ._મે_જૂન_જુલા._ઑગ._સપ્ટે._ઑક્ટ્._નવે._ડિસે.'.split('_'),
          monthsParseExact: !0,
          weekdays: 'રવિવાર_સોમવાર_મંગળવાર_બુધ્વાર_ગુરુવાર_શુક્રવાર_શનિવાર'.split('_'),
          weekdaysShort: 'રવિ_સોમ_મંગળ_બુધ્_ગુરુ_શુક્ર_શનિ'.split('_'),
          weekdaysMin: 'ર_સો_મં_બુ_ગુ_શુ_શ'.split('_'),
          longDateFormat: { LT: 'A h:mm વાગ્યે', LTS: 'A h:mm:ss વાગ્યે', L: 'DD/MM/YYYY', LL: 'D MMMM YYYY', LLL: 'D MMMM YYYY, A h:mm વાગ્યે', LLLL: 'dddd, D MMMM YYYY, A h:mm વાગ્યે' },
          calendar: { sameDay: '[આજ] LT', nextDay: '[કાલે] LT', nextWeek: 'dddd, LT', lastDay: '[ગઇકાલે] LT', lastWeek: '[પાછલા] dddd, LT', sameElse: 'L' },
          relativeTime: { future: '%s મા', past: '%s પહેલા', s: 'અમુક પળો', ss: '%d સેકંડ', m: 'એક મિનિટ', mm: '%d મિનિટ', h: 'એક કલાક', hh: '%d કલાક', d: 'એક દિવસ', dd: '%d દિવસ', M: 'એક મહિનો', MM: '%d મહિનો', y: 'એક વર્ષ', yy: '%d વર્ષ' },
          preparse: function (e) {
            return e.replace(/[\u0ae7\u0ae8\u0ae9\u0aea\u0aeb\u0aec\u0aed\u0aee\u0aef\u0ae6]/g, function (e) {
              return Yn[e];
            });
          },
          postformat: function (e) {
            return e.replace(/\d/g, function (e) {
              return Ln[e];
            });
          },
          meridiemParse: /\u0ab0\u0abe\u0aa4|\u0aac\u0aaa\u0acb\u0ab0|\u0ab8\u0ab5\u0abe\u0ab0|\u0ab8\u0abe\u0a82\u0a9c/,
          meridiemHour: function (e, a) {
            return 12 === e && (e = 0), 'રાત' === a ? (e < 4 ? e : e + 12) : 'સવાર' === a ? e : 'બપોર' === a ? (10 <= e ? e : e + 12) : 'સાંજ' === a ? e + 12 : void 0;
          },
          meridiem: function (e, a, t) {
            return e < 4 ? 'રાત' : e < 10 ? 'સવાર' : e < 17 ? 'બપોર' : e < 20 ? 'સાંજ' : 'રાત';
          },
          week: { dow: 0, doy: 6 },
        }),
          t.defineLocale('he', {
            months: 'ינואר_פברואר_מרץ_אפריל_מאי_יוני_יולי_אוגוסט_ספטמבר_אוקטובר_נובמבר_דצמבר'.split('_'),
            monthsShort: 'ינו׳_פבר׳_מרץ_אפר׳_מאי_יוני_יולי_אוג׳_ספט׳_אוק׳_נוב׳_דצמ׳'.split('_'),
            weekdays: 'ראשון_שני_שלישי_רביעי_חמישי_שישי_שבת'.split('_'),
            weekdaysShort: 'א׳_ב׳_ג׳_ד׳_ה׳_ו׳_ש׳'.split('_'),
            weekdaysMin: 'א_ב_ג_ד_ה_ו_ש'.split('_'),
            longDateFormat: { LT: 'HH:mm', LTS: 'HH:mm:ss', L: 'DD/MM/YYYY', LL: 'D [ב]MMMM YYYY', LLL: 'D [ב]MMMM YYYY HH:mm', LLLL: 'dddd, D [ב]MMMM YYYY HH:mm', l: 'D/M/YYYY', ll: 'D MMM YYYY', lll: 'D MMM YYYY HH:mm', llll: 'ddd, D MMM YYYY HH:mm' },
            calendar: { sameDay: '[היום ב־]LT', nextDay: '[מחר ב־]LT', nextWeek: 'dddd [בשעה] LT', lastDay: '[אתמול ב־]LT', lastWeek: '[ביום] dddd [האחרון בשעה] LT', sameElse: 'L' },
            relativeTime: {
              future: 'בעוד %s',
              past: 'לפני %s',
              s: 'מספר שניות',
              ss: '%d שניות',
              m: 'דקה',
              mm: '%d דקות',
              h: 'שעה',
              hh: function (e) {
                return 2 === e ? 'שעתיים' : e + ' שעות';
              },
              d: 'יום',
              dd: function (e) {
                return 2 === e ? 'יומיים' : e + ' ימים';
              },
              M: 'חודש',
              MM: function (e) {
                return 2 === e ? 'חודשיים' : e + ' חודשים';
              },
              y: 'שנה',
              yy: function (e) {
                return 2 === e ? 'שנתיים' : e % 10 == 0 && 10 !== e ? e + ' שנה' : e + ' שנים';
              },
            },
            meridiemParse:
              /\u05d0\u05d7\u05d4"\u05e6|\u05dc\u05e4\u05e0\u05d4"\u05e6|\u05d0\u05d7\u05e8\u05d9 \u05d4\u05e6\u05d4\u05e8\u05d9\u05d9\u05dd|\u05dc\u05e4\u05e0\u05d9 \u05d4\u05e6\u05d4\u05e8\u05d9\u05d9\u05dd|\u05dc\u05e4\u05e0\u05d5\u05ea \u05d1\u05d5\u05e7\u05e8|\u05d1\u05d1\u05d5\u05e7\u05e8|\u05d1\u05e2\u05e8\u05d1/i,
            isPM: function (e) {
              return /^(\u05d0\u05d7\u05d4"\u05e6|\u05d0\u05d7\u05e8\u05d9 \u05d4\u05e6\u05d4\u05e8\u05d9\u05d9\u05dd|\u05d1\u05e2\u05e8\u05d1)$/.test(e);
            },
            meridiem: function (e, a, t) {
              return e < 5 ? 'לפנות בוקר' : e < 10 ? 'בבוקר' : e < 12 ? (t ? 'לפנה"צ' : 'לפני הצהריים') : e < 18 ? (t ? 'אחה"צ' : 'אחרי הצהריים') : 'בערב';
            },
          });
        var yn = { 1: '१', 2: '२', 3: '३', 4: '४', 5: '५', 6: '६', 7: '७', 8: '८', 9: '९', 0: '०' },
          fn = { '१': '1', '२': '2', '३': '3', '४': '4', '५': '5', '६': '6', '७': '7', '८': '8', '९': '9', '०': '0' },
          pn = [
            /^\u091c\u0928/i,
            /^\u092b\u093c\u0930|\u092b\u0930/i,
            /^\u092e\u093e\u0930\u094d\u091a/i,
            /^\u0905\u092a\u094d\u0930\u0948/i,
            /^\u092e\u0908/i,
            /^\u091c\u0942\u0928/i,
            /^\u091c\u0941\u0932/i,
            /^\u0905\u0917/i,
            /^\u0938\u093f\u0924\u0902|\u0938\u093f\u0924/i,
            /^\u0905\u0915\u094d\u091f\u0942/i,
            /^\u0928\u0935|\u0928\u0935\u0902/i,
            /^\u0926\u093f\u0938\u0902|\u0926\u093f\u0938/i,
          ];
        function kn(e, a, t) {
          var s = e + ' ';
          switch (t) {
            case 'ss':
              return (s += 1 === e ? 'sekunda' : 2 === e || 3 === e || 4 === e ? 'sekunde' : 'sekundi');
            case 'm':
              return a ? 'jedna minuta' : 'jedne minute';
            case 'mm':
              return (s += 1 !== e && (2 === e || 3 === e || 4 === e) ? 'minute' : 'minuta');
            case 'h':
              return a ? 'jedan sat' : 'jednog sata';
            case 'hh':
              return (s += 1 === e ? 'sat' : 2 === e || 3 === e || 4 === e ? 'sata' : 'sati');
            case 'dd':
              return (s += 1 === e ? 'dan' : 'dana');
            case 'MM':
              return (s += 1 === e ? 'mjesec' : 2 === e || 3 === e || 4 === e ? 'mjeseca' : 'mjeseci');
            case 'yy':
              return (s += 1 !== e && (2 === e || 3 === e || 4 === e) ? 'godine' : 'godina');
          }
        }
        t.defineLocale('hi', {
          months: { format: 'जनवरी_फ़रवरी_मार्च_अप्रैल_मई_जून_जुलाई_अगस्त_सितम्बर_अक्टूबर_नवम्बर_दिसम्बर'.split('_'), standalone: 'जनवरी_फरवरी_मार्च_अप्रैल_मई_जून_जुलाई_अगस्त_सितंबर_अक्टूबर_नवंबर_दिसंबर'.split('_') },
          monthsShort: 'जन._फ़र._मार्च_अप्रै._मई_जून_जुल._अग._सित._अक्टू._नव._दिस.'.split('_'),
          weekdays: 'रविवार_सोमवार_मंगलवार_बुधवार_गुरूवार_शुक्रवार_शनिवार'.split('_'),
          weekdaysShort: 'रवि_सोम_मंगल_बुध_गुरू_शुक्र_शनि'.split('_'),
          weekdaysMin: 'र_सो_मं_बु_गु_शु_श'.split('_'),
          longDateFormat: { LT: 'A h:mm बजे', LTS: 'A h:mm:ss बजे', L: 'DD/MM/YYYY', LL: 'D MMMM YYYY', LLL: 'D MMMM YYYY, A h:mm बजे', LLLL: 'dddd, D MMMM YYYY, A h:mm बजे' },
          monthsParse: pn,
          longMonthsParse: pn,
          shortMonthsParse: [
            /^\u091c\u0928/i,
            /^\u092b\u093c\u0930/i,
            /^\u092e\u093e\u0930\u094d\u091a/i,
            /^\u0905\u092a\u094d\u0930\u0948/i,
            /^\u092e\u0908/i,
            /^\u091c\u0942\u0928/i,
            /^\u091c\u0941\u0932/i,
            /^\u0905\u0917/i,
            /^\u0938\u093f\u0924/i,
            /^\u0905\u0915\u094d\u091f\u0942/i,
            /^\u0928\u0935/i,
            /^\u0926\u093f\u0938/i,
          ],
          monthsRegex:
            /^(\u091c\u0928\u0935\u0930\u0940|\u091c\u0928\.?|\u092b\u093c\u0930\u0935\u0930\u0940|\u092b\u0930\u0935\u0930\u0940|\u092b\u093c\u0930\.?|\u092e\u093e\u0930\u094d\u091a?|\u0905\u092a\u094d\u0930\u0948\u0932|\u0905\u092a\u094d\u0930\u0948\.?|\u092e\u0908?|\u091c\u0942\u0928?|\u091c\u0941\u0932\u093e\u0908|\u091c\u0941\u0932\.?|\u0905\u0917\u0938\u094d\u0924|\u0905\u0917\.?|\u0938\u093f\u0924\u092e\u094d\u092c\u0930|\u0938\u093f\u0924\u0902\u092c\u0930|\u0938\u093f\u0924\.?|\u0905\u0915\u094d\u091f\u0942\u092c\u0930|\u0905\u0915\u094d\u091f\u0942\.?|\u0928\u0935\u092e\u094d\u092c\u0930|\u0928\u0935\u0902\u092c\u0930|\u0928\u0935\.?|\u0926\u093f\u0938\u092e\u094d\u092c\u0930|\u0926\u093f\u0938\u0902\u092c\u0930|\u0926\u093f\u0938\.?)/i,
          monthsShortRegex:
            /^(\u091c\u0928\u0935\u0930\u0940|\u091c\u0928\.?|\u092b\u093c\u0930\u0935\u0930\u0940|\u092b\u0930\u0935\u0930\u0940|\u092b\u093c\u0930\.?|\u092e\u093e\u0930\u094d\u091a?|\u0905\u092a\u094d\u0930\u0948\u0932|\u0905\u092a\u094d\u0930\u0948\.?|\u092e\u0908?|\u091c\u0942\u0928?|\u091c\u0941\u0932\u093e\u0908|\u091c\u0941\u0932\.?|\u0905\u0917\u0938\u094d\u0924|\u0905\u0917\.?|\u0938\u093f\u0924\u092e\u094d\u092c\u0930|\u0938\u093f\u0924\u0902\u092c\u0930|\u0938\u093f\u0924\.?|\u0905\u0915\u094d\u091f\u0942\u092c\u0930|\u0905\u0915\u094d\u091f\u0942\.?|\u0928\u0935\u092e\u094d\u092c\u0930|\u0928\u0935\u0902\u092c\u0930|\u0928\u0935\.?|\u0926\u093f\u0938\u092e\u094d\u092c\u0930|\u0926\u093f\u0938\u0902\u092c\u0930|\u0926\u093f\u0938\.?)/i,
          monthsStrictRegex:
            /^(\u091c\u0928\u0935\u0930\u0940?|\u092b\u093c\u0930\u0935\u0930\u0940|\u092b\u0930\u0935\u0930\u0940?|\u092e\u093e\u0930\u094d\u091a?|\u0905\u092a\u094d\u0930\u0948\u0932?|\u092e\u0908?|\u091c\u0942\u0928?|\u091c\u0941\u0932\u093e\u0908?|\u0905\u0917\u0938\u094d\u0924?|\u0938\u093f\u0924\u092e\u094d\u092c\u0930|\u0938\u093f\u0924\u0902\u092c\u0930|\u0938\u093f\u0924?\.?|\u0905\u0915\u094d\u091f\u0942\u092c\u0930|\u0905\u0915\u094d\u091f\u0942\.?|\u0928\u0935\u092e\u094d\u092c\u0930|\u0928\u0935\u0902\u092c\u0930?|\u0926\u093f\u0938\u092e\u094d\u092c\u0930|\u0926\u093f\u0938\u0902\u092c\u0930?)/i,
          monthsShortStrictRegex:
            /^(\u091c\u0928\.?|\u092b\u093c\u0930\.?|\u092e\u093e\u0930\u094d\u091a?|\u0905\u092a\u094d\u0930\u0948\.?|\u092e\u0908?|\u091c\u0942\u0928?|\u091c\u0941\u0932\.?|\u0905\u0917\.?|\u0938\u093f\u0924\.?|\u0905\u0915\u094d\u091f\u0942\.?|\u0928\u0935\.?|\u0926\u093f\u0938\.?)/i,
          calendar: { sameDay: '[आज] LT', nextDay: '[कल] LT', nextWeek: 'dddd, LT', lastDay: '[कल] LT', lastWeek: '[पिछले] dddd, LT', sameElse: 'L' },
          relativeTime: { future: '%s में', past: '%s पहले', s: 'कुछ ही क्षण', ss: '%d सेकंड', m: 'एक मिनट', mm: '%d मिनट', h: 'एक घंटा', hh: '%d घंटे', d: 'एक दिन', dd: '%d दिन', M: 'एक महीने', MM: '%d महीने', y: 'एक वर्ष', yy: '%d वर्ष' },
          preparse: function (e) {
            return e.replace(/[\u0967\u0968\u0969\u096a\u096b\u096c\u096d\u096e\u096f\u0966]/g, function (e) {
              return fn[e];
            });
          },
          postformat: function (e) {
            return e.replace(/\d/g, function (e) {
              return yn[e];
            });
          },
          meridiemParse: /\u0930\u093e\u0924|\u0938\u0941\u092c\u0939|\u0926\u094b\u092a\u0939\u0930|\u0936\u093e\u092e/,
          meridiemHour: function (e, a) {
            return 12 === e && (e = 0), 'रात' === a ? (e < 4 ? e : e + 12) : 'सुबह' === a ? e : 'दोपहर' === a ? (10 <= e ? e : e + 12) : 'शाम' === a ? e + 12 : void 0;
          },
          meridiem: function (e, a, t) {
            return e < 4 ? 'रात' : e < 10 ? 'सुबह' : e < 17 ? 'दोपहर' : e < 20 ? 'शाम' : 'रात';
          },
          week: { dow: 0, doy: 6 },
        }),
          t.defineLocale('hr', {
            months: { format: 'siječnja_veljače_ožujka_travnja_svibnja_lipnja_srpnja_kolovoza_rujna_listopada_studenoga_prosinca'.split('_'), standalone: 'siječanj_veljača_ožujak_travanj_svibanj_lipanj_srpanj_kolovoz_rujan_listopad_studeni_prosinac'.split('_') },
            monthsShort: 'sij._velj._ožu._tra._svi._lip._srp._kol._ruj._lis._stu._pro.'.split('_'),
            monthsParseExact: !0,
            weekdays: 'nedjelja_ponedjeljak_utorak_srijeda_četvrtak_petak_subota'.split('_'),
            weekdaysShort: 'ned._pon._uto._sri._čet._pet._sub.'.split('_'),
            weekdaysMin: 'ne_po_ut_sr_če_pe_su'.split('_'),
            weekdaysParseExact: !0,
            longDateFormat: { LT: 'H:mm', LTS: 'H:mm:ss', L: 'DD.MM.YYYY', LL: 'Do MMMM YYYY', LLL: 'Do MMMM YYYY H:mm', LLLL: 'dddd, Do MMMM YYYY H:mm' },
            calendar: {
              sameDay: '[danas u] LT',
              nextDay: '[sutra u] LT',
              nextWeek: function () {
                switch (this.day()) {
                  case 0:
                    return '[u] [nedjelju] [u] LT';
                  case 3:
                    return '[u] [srijedu] [u] LT';
                  case 6:
                    return '[u] [subotu] [u] LT';
                  case 1:
                  case 2:
                  case 4:
                  case 5:
                    return '[u] dddd [u] LT';
                }
              },
              lastDay: '[jučer u] LT',
              lastWeek: function () {
                switch (this.day()) {
                  case 0:
                    return '[prošlu] [nedjelju] [u] LT';
                  case 3:
                    return '[prošlu] [srijedu] [u] LT';
                  case 6:
                    return '[prošle] [subote] [u] LT';
                  case 1:
                  case 2:
                  case 4:
                  case 5:
                    return '[prošli] dddd [u] LT';
                }
              },
              sameElse: 'L',
            },
            relativeTime: { future: 'za %s', past: 'prije %s', s: 'par sekundi', ss: kn, m: kn, mm: kn, h: kn, hh: kn, d: 'dan', dd: kn, M: 'mjesec', MM: kn, y: 'godinu', yy: kn },
            dayOfMonthOrdinalParse: /\d{1,2}\./,
            ordinal: '%d.',
            week: { dow: 1, doy: 7 },
          });
        var Dn = 'vasárnap hétfőn kedden szerdán csütörtökön pénteken szombaton'.split(' ');
        function Tn(e, a, t, s) {
          var n = e;
          switch (t) {
            case 's':
              return s || a ? 'néhány másodperc' : 'néhány másodperce';
            case 'ss':
              return n + (s || a) ? ' másodperc' : ' másodperce';
            case 'm':
              return 'egy' + (s || a ? ' perc' : ' perce');
            case 'mm':
              return n + (s || a ? ' perc' : ' perce');
            case 'h':
              return 'egy' + (s || a ? ' óra' : ' órája');
            case 'hh':
              return n + (s || a ? ' óra' : ' órája');
            case 'd':
              return 'egy' + (s || a ? ' nap' : ' napja');
            case 'dd':
              return n + (s || a ? ' nap' : ' napja');
            case 'M':
              return 'egy' + (s || a ? ' hónap' : ' hónapja');
            case 'MM':
              return n + (s || a ? ' hónap' : ' hónapja');
            case 'y':
              return 'egy' + (s || a ? ' év' : ' éve');
            case 'yy':
              return n + (s || a ? ' év' : ' éve');
          }
          return '';
        }
        function gn(e) {
          return (e ? '' : '[múlt] ') + '[' + Dn[this.day()] + '] LT[-kor]';
        }
        function wn(e) {
          return e % 100 == 11 || e % 10 != 1;
        }
        function bn(e, a, t, s) {
          var n = e + ' ';
          switch (t) {
            case 's':
              return a || s ? 'nokkrar sekúndur' : 'nokkrum sekúndum';
            case 'ss':
              return wn(e) ? n + (a || s ? 'sekúndur' : 'sekúndum') : n + 'sekúnda';
            case 'm':
              return a ? 'mínúta' : 'mínútu';
            case 'mm':
              return wn(e) ? n + (a || s ? 'mínútur' : 'mínútum') : a ? n + 'mínúta' : n + 'mínútu';
            case 'hh':
              return wn(e) ? n + (a || s ? 'klukkustundir' : 'klukkustundum') : n + 'klukkustund';
            case 'd':
              return a ? 'dagur' : s ? 'dag' : 'degi';
            case 'dd':
              return wn(e) ? (a ? n + 'dagar' : n + (s ? 'daga' : 'dögum')) : a ? n + 'dagur' : n + (s ? 'dag' : 'degi');
            case 'M':
              return a ? 'mánuður' : s ? 'mánuð' : 'mánuði';
            case 'MM':
              return wn(e) ? (a ? n + 'mánuðir' : n + (s ? 'mánuði' : 'mánuðum')) : a ? n + 'mánuður' : n + (s ? 'mánuð' : 'mánuði');
            case 'y':
              return a || s ? 'ár' : 'ári';
            case 'yy':
              return wn(e) ? n + (a || s ? 'ár' : 'árum') : n + (a || s ? 'ár' : 'ári');
          }
        }
        t.defineLocale('hu', {
          months: 'január_február_március_április_május_június_július_augusztus_szeptember_október_november_december'.split('_'),
          monthsShort: 'jan._feb._márc._ápr._máj._jún._júl._aug._szept._okt._nov._dec.'.split('_'),
          monthsParseExact: !0,
          weekdays: 'vasárnap_hétfő_kedd_szerda_csütörtök_péntek_szombat'.split('_'),
          weekdaysShort: 'vas_hét_kedd_sze_csüt_pén_szo'.split('_'),
          weekdaysMin: 'v_h_k_sze_cs_p_szo'.split('_'),
          longDateFormat: { LT: 'H:mm', LTS: 'H:mm:ss', L: 'YYYY.MM.DD.', LL: 'YYYY. MMMM D.', LLL: 'YYYY. MMMM D. H:mm', LLLL: 'YYYY. MMMM D., dddd H:mm' },
          meridiemParse: /de|du/i,
          isPM: function (e) {
            return 'u' === e.charAt(1).toLowerCase();
          },
          meridiem: function (e, a, t) {
            return e < 12 ? (!0 === t ? 'de' : 'DE') : !0 === t ? 'du' : 'DU';
          },
          calendar: {
            sameDay: '[ma] LT[-kor]',
            nextDay: '[holnap] LT[-kor]',
            nextWeek: function () {
              return gn.call(this, !0);
            },
            lastDay: '[tegnap] LT[-kor]',
            lastWeek: function () {
              return gn.call(this, !1);
            },
            sameElse: 'L',
          },
          relativeTime: { future: '%s múlva', past: '%s', s: Tn, ss: Tn, m: Tn, mm: Tn, h: Tn, hh: Tn, d: Tn, dd: Tn, M: Tn, MM: Tn, y: Tn, yy: Tn },
          dayOfMonthOrdinalParse: /\d{1,2}\./,
          ordinal: '%d.',
          week: { dow: 1, doy: 4 },
        }),
          t.defineLocale('hy-am', {
            months: { format: 'հունվարի_փետրվարի_մարտի_ապրիլի_մայիսի_հունիսի_հուլիսի_օգոստոսի_սեպտեմբերի_հոկտեմբերի_նոյեմբերի_դեկտեմբերի'.split('_'), standalone: 'հունվար_փետրվար_մարտ_ապրիլ_մայիս_հունիս_հուլիս_օգոստոս_սեպտեմբեր_հոկտեմբեր_նոյեմբեր_դեկտեմբեր'.split('_') },
            monthsShort: 'հնվ_փտր_մրտ_ապր_մյս_հնս_հլս_օգս_սպտ_հկտ_նմբ_դկտ'.split('_'),
            weekdays: 'կիրակի_երկուշաբթի_երեքշաբթի_չորեքշաբթի_հինգշաբթի_ուրբաթ_շաբաթ'.split('_'),
            weekdaysShort: 'կրկ_երկ_երք_չրք_հնգ_ուրբ_շբթ'.split('_'),
            weekdaysMin: 'կրկ_երկ_երք_չրք_հնգ_ուրբ_շբթ'.split('_'),
            longDateFormat: { LT: 'HH:mm', LTS: 'HH:mm:ss', L: 'DD.MM.YYYY', LL: 'D MMMM YYYY թ.', LLL: 'D MMMM YYYY թ., HH:mm', LLLL: 'dddd, D MMMM YYYY թ., HH:mm' },
            calendar: {
              sameDay: '[այսօր] LT',
              nextDay: '[վաղը] LT',
              lastDay: '[երեկ] LT',
              nextWeek: function () {
                return 'dddd [օրը ժամը] LT';
              },
              lastWeek: function () {
                return '[անցած] dddd [օրը ժամը] LT';
              },
              sameElse: 'L',
            },
            relativeTime: { future: '%s հետո', past: '%s առաջ', s: 'մի քանի վայրկյան', ss: '%d վայրկյան', m: 'րոպե', mm: '%d րոպե', h: 'ժամ', hh: '%d ժամ', d: 'օր', dd: '%d օր', M: 'ամիս', MM: '%d ամիս', y: 'տարի', yy: '%d տարի' },
            meridiemParse: /\u0563\u056b\u0577\u0565\u0580\u057e\u0561|\u0561\u057c\u0561\u057e\u0578\u057f\u057e\u0561|\u0581\u0565\u0580\u0565\u056f\u057e\u0561|\u0565\u0580\u0565\u056f\u0578\u0575\u0561\u0576/,
            isPM: function (e) {
              return /^(\u0581\u0565\u0580\u0565\u056f\u057e\u0561|\u0565\u0580\u0565\u056f\u0578\u0575\u0561\u0576)$/.test(e);
            },
            meridiem: function (e) {
              return e < 4 ? 'գիշերվա' : e < 12 ? 'առավոտվա' : e < 17 ? 'ցերեկվա' : 'երեկոյան';
            },
            dayOfMonthOrdinalParse: /\d{1,2}|\d{1,2}-(\u056b\u0576|\u0580\u0564)/,
            ordinal: function (e, a) {
              switch (a) {
                case 'DDD':
                case 'w':
                case 'W':
                case 'DDDo':
                  return 1 === e ? e + '-ին' : e + '-րդ';
                default:
                  return e;
              }
            },
            week: { dow: 1, doy: 7 },
          }),
          t.defineLocale('id', {
            months: 'Januari_Februari_Maret_April_Mei_Juni_Juli_Agustus_September_Oktober_November_Desember'.split('_'),
            monthsShort: 'Jan_Feb_Mar_Apr_Mei_Jun_Jul_Agt_Sep_Okt_Nov_Des'.split('_'),
            weekdays: 'Minggu_Senin_Selasa_Rabu_Kamis_Jumat_Sabtu'.split('_'),
            weekdaysShort: 'Min_Sen_Sel_Rab_Kam_Jum_Sab'.split('_'),
            weekdaysMin: 'Mg_Sn_Sl_Rb_Km_Jm_Sb'.split('_'),
            longDateFormat: { LT: 'HH.mm', LTS: 'HH.mm.ss', L: 'DD/MM/YYYY', LL: 'D MMMM YYYY', LLL: 'D MMMM YYYY [pukul] HH.mm', LLLL: 'dddd, D MMMM YYYY [pukul] HH.mm' },
            meridiemParse: /pagi|siang|sore|malam/,
            meridiemHour: function (e, a) {
              return 12 === e && (e = 0), 'pagi' === a ? e : 'siang' === a ? (11 <= e ? e : e + 12) : 'sore' === a || 'malam' === a ? e + 12 : void 0;
            },
            meridiem: function (e, a, t) {
              return e < 11 ? 'pagi' : e < 15 ? 'siang' : e < 19 ? 'sore' : 'malam';
            },
            calendar: { sameDay: '[Hari ini pukul] LT', nextDay: '[Besok pukul] LT', nextWeek: 'dddd [pukul] LT', lastDay: '[Kemarin pukul] LT', lastWeek: 'dddd [lalu pukul] LT', sameElse: 'L' },
            relativeTime: { future: 'dalam %s', past: '%s yang lalu', s: 'beberapa detik', ss: '%d detik', m: 'semenit', mm: '%d menit', h: 'sejam', hh: '%d jam', d: 'sehari', dd: '%d hari', M: 'sebulan', MM: '%d bulan', y: 'setahun', yy: '%d tahun' },
            week: { dow: 0, doy: 6 },
          }),
          t.defineLocale('is', {
            months: 'janúar_febrúar_mars_apríl_maí_júní_júlí_ágúst_september_október_nóvember_desember'.split('_'),
            monthsShort: 'jan_feb_mar_apr_maí_jún_júl_ágú_sep_okt_nóv_des'.split('_'),
            weekdays: 'sunnudagur_mánudagur_þriðjudagur_miðvikudagur_fimmtudagur_föstudagur_laugardagur'.split('_'),
            weekdaysShort: 'sun_mán_þri_mið_fim_fös_lau'.split('_'),
            weekdaysMin: 'Su_Má_Þr_Mi_Fi_Fö_La'.split('_'),
            longDateFormat: { LT: 'H:mm', LTS: 'H:mm:ss', L: 'DD.MM.YYYY', LL: 'D. MMMM YYYY', LLL: 'D. MMMM YYYY [kl.] H:mm', LLLL: 'dddd, D. MMMM YYYY [kl.] H:mm' },
            calendar: { sameDay: '[í dag kl.] LT', nextDay: '[á morgun kl.] LT', nextWeek: 'dddd [kl.] LT', lastDay: '[í gær kl.] LT', lastWeek: '[síðasta] dddd [kl.] LT', sameElse: 'L' },
            relativeTime: { future: 'eftir %s', past: 'fyrir %s síðan', s: bn, ss: bn, m: bn, mm: bn, h: 'klukkustund', hh: bn, d: bn, dd: bn, M: bn, MM: bn, y: bn, yy: bn },
            dayOfMonthOrdinalParse: /\d{1,2}\./,
            ordinal: '%d.',
            week: { dow: 1, doy: 4 },
          }),
          t.defineLocale('it-ch', {
            months: 'gennaio_febbraio_marzo_aprile_maggio_giugno_luglio_agosto_settembre_ottobre_novembre_dicembre'.split('_'),
            monthsShort: 'gen_feb_mar_apr_mag_giu_lug_ago_set_ott_nov_dic'.split('_'),
            weekdays: 'domenica_lunedì_martedì_mercoledì_giovedì_venerdì_sabato'.split('_'),
            weekdaysShort: 'dom_lun_mar_mer_gio_ven_sab'.split('_'),
            weekdaysMin: 'do_lu_ma_me_gi_ve_sa'.split('_'),
            longDateFormat: { LT: 'HH:mm', LTS: 'HH:mm:ss', L: 'DD.MM.YYYY', LL: 'D MMMM YYYY', LLL: 'D MMMM YYYY HH:mm', LLLL: 'dddd D MMMM YYYY HH:mm' },
            calendar: {
              sameDay: '[Oggi alle] LT',
              nextDay: '[Domani alle] LT',
              nextWeek: 'dddd [alle] LT',
              lastDay: '[Ieri alle] LT',
              lastWeek: function () {
                switch (this.day()) {
                  case 0:
                    return '[la scorsa] dddd [alle] LT';
                  default:
                    return '[lo scorso] dddd [alle] LT';
                }
              },
              sameElse: 'L',
            },
            relativeTime: {
              future: function (e) {
                return (/^[0-9].+$/.test(e) ? 'tra' : 'in') + ' ' + e;
              },
              past: '%s fa',
              s: 'alcuni secondi',
              ss: '%d secondi',
              m: 'un minuto',
              mm: '%d minuti',
              h: "un'ora",
              hh: '%d ore',
              d: 'un giorno',
              dd: '%d giorni',
              M: 'un mese',
              MM: '%d mesi',
              y: 'un anno',
              yy: '%d anni',
            },
            dayOfMonthOrdinalParse: /\d{1,2}\xba/,
            ordinal: '%dº',
            week: { dow: 1, doy: 4 },
          }),
          t.defineLocale('it', {
            months: 'gennaio_febbraio_marzo_aprile_maggio_giugno_luglio_agosto_settembre_ottobre_novembre_dicembre'.split('_'),
            monthsShort: 'gen_feb_mar_apr_mag_giu_lug_ago_set_ott_nov_dic'.split('_'),
            weekdays: 'domenica_lunedì_martedì_mercoledì_giovedì_venerdì_sabato'.split('_'),
            weekdaysShort: 'dom_lun_mar_mer_gio_ven_sab'.split('_'),
            weekdaysMin: 'do_lu_ma_me_gi_ve_sa'.split('_'),
            longDateFormat: { LT: 'HH:mm', LTS: 'HH:mm:ss', L: 'DD/MM/YYYY', LL: 'D MMMM YYYY', LLL: 'D MMMM YYYY HH:mm', LLLL: 'dddd D MMMM YYYY HH:mm' },
            calendar: {
              sameDay: function () {
                return '[Oggi a' + (1 < this.hours() ? 'lle ' : 0 === this.hours() ? ' ' : "ll'") + ']LT';
              },
              nextDay: function () {
                return '[Domani a' + (1 < this.hours() ? 'lle ' : 0 === this.hours() ? ' ' : "ll'") + ']LT';
              },
              nextWeek: function () {
                return 'dddd [a' + (1 < this.hours() ? 'lle ' : 0 === this.hours() ? ' ' : "ll'") + ']LT';
              },
              lastDay: function () {
                return '[Ieri a' + (1 < this.hours() ? 'lle ' : 0 === this.hours() ? ' ' : "ll'") + ']LT';
              },
              lastWeek: function () {
                switch (this.day()) {
                  case 0:
                    return '[La scorsa] dddd [a' + (1 < this.hours() ? 'lle ' : 0 === this.hours() ? ' ' : "ll'") + ']LT';
                  default:
                    return '[Lo scorso] dddd [a' + (1 < this.hours() ? 'lle ' : 0 === this.hours() ? ' ' : "ll'") + ']LT';
                }
              },
              sameElse: 'L',
            },
            relativeTime: { future: 'tra %s', past: '%s fa', s: 'alcuni secondi', ss: '%d secondi', m: 'un minuto', mm: '%d minuti', h: "un'ora", hh: '%d ore', d: 'un giorno', dd: '%d giorni', w: 'una settimana', ww: '%d settimane', M: 'un mese', MM: '%d mesi', y: 'un anno', yy: '%d anni' },
            dayOfMonthOrdinalParse: /\d{1,2}\xba/,
            ordinal: '%dº',
            week: { dow: 1, doy: 4 },
          }),
          t.defineLocale('ja', {
            eras: [
              { since: '2019-05-01', offset: 1, name: '令和', narrow: '㋿', abbr: 'R' },
              { since: '1989-01-08', until: '2019-04-30', offset: 1, name: '平成', narrow: '㍻', abbr: 'H' },
              { since: '1926-12-25', until: '1989-01-07', offset: 1, name: '昭和', narrow: '㍼', abbr: 'S' },
              { since: '1912-07-30', until: '1926-12-24', offset: 1, name: '大正', narrow: '㍽', abbr: 'T' },
              { since: '1873-01-01', until: '1912-07-29', offset: 6, name: '明治', narrow: '㍾', abbr: 'M' },
              { since: '0001-01-01', until: '1873-12-31', offset: 1, name: '西暦', narrow: 'AD', abbr: 'AD' },
              { since: '0000-12-31', until: -1 / 0, offset: 1, name: '紀元前', narrow: 'BC', abbr: 'BC' },
            ],
            eraYearOrdinalRegex: /(\u5143|\d+)\u5e74/,
            eraYearOrdinalParse: function (e, a) {
              return '元' === a[1] ? 1 : parseInt(a[1] || e, 10);
            },
            months: '1月_2月_3月_4月_5月_6月_7月_8月_9月_10月_11月_12月'.split('_'),
            monthsShort: '1月_2月_3月_4月_5月_6月_7月_8月_9月_10月_11月_12月'.split('_'),
            weekdays: '日曜日_月曜日_火曜日_水曜日_木曜日_金曜日_土曜日'.split('_'),
            weekdaysShort: '日_月_火_水_木_金_土'.split('_'),
            weekdaysMin: '日_月_火_水_木_金_土'.split('_'),
            longDateFormat: { LT: 'HH:mm', LTS: 'HH:mm:ss', L: 'YYYY/MM/DD', LL: 'YYYY年M月D日', LLL: 'YYYY年M月D日 HH:mm', LLLL: 'YYYY年M月D日 dddd HH:mm', l: 'YYYY/MM/DD', ll: 'YYYY年M月D日', lll: 'YYYY年M月D日 HH:mm', llll: 'YYYY年M月D日(ddd) HH:mm' },
            meridiemParse: /\u5348\u524d|\u5348\u5f8c/i,
            isPM: function (e) {
              return '午後' === e;
            },
            meridiem: function (e, a, t) {
              return e < 12 ? '午前' : '午後';
            },
            calendar: {
              sameDay: '[今日] LT',
              nextDay: '[明日] LT',
              nextWeek: function (e) {
                return e.week() !== this.week() ? '[来週]dddd LT' : 'dddd LT';
              },
              lastDay: '[昨日] LT',
              lastWeek: function (e) {
                return this.week() !== e.week() ? '[先週]dddd LT' : 'dddd LT';
              },
              sameElse: 'L',
            },
            dayOfMonthOrdinalParse: /\d{1,2}\u65e5/,
            ordinal: function (e, a) {
              switch (a) {
                case 'y':
                  return 1 === e ? '元年' : e + '年';
                case 'd':
                case 'D':
                case 'DDD':
                  return e + '日';
                default:
                  return e;
              }
            },
            relativeTime: { future: '%s後', past: '%s前', s: '数秒', ss: '%d秒', m: '1分', mm: '%d分', h: '1時間', hh: '%d時間', d: '1日', dd: '%d日', M: '1ヶ月', MM: '%dヶ月', y: '1年', yy: '%d年' },
          }),
          t.defineLocale('jv', {
            months: 'Januari_Februari_Maret_April_Mei_Juni_Juli_Agustus_September_Oktober_Nopember_Desember'.split('_'),
            monthsShort: 'Jan_Feb_Mar_Apr_Mei_Jun_Jul_Ags_Sep_Okt_Nop_Des'.split('_'),
            weekdays: 'Minggu_Senen_Seloso_Rebu_Kemis_Jemuwah_Septu'.split('_'),
            weekdaysShort: 'Min_Sen_Sel_Reb_Kem_Jem_Sep'.split('_'),
            weekdaysMin: 'Mg_Sn_Sl_Rb_Km_Jm_Sp'.split('_'),
            longDateFormat: { LT: 'HH.mm', LTS: 'HH.mm.ss', L: 'DD/MM/YYYY', LL: 'D MMMM YYYY', LLL: 'D MMMM YYYY [pukul] HH.mm', LLLL: 'dddd, D MMMM YYYY [pukul] HH.mm' },
            meridiemParse: /enjing|siyang|sonten|ndalu/,
            meridiemHour: function (e, a) {
              return 12 === e && (e = 0), 'enjing' === a ? e : 'siyang' === a ? (11 <= e ? e : e + 12) : 'sonten' === a || 'ndalu' === a ? e + 12 : void 0;
            },
            meridiem: function (e, a, t) {
              return e < 11 ? 'enjing' : e < 15 ? 'siyang' : e < 19 ? 'sonten' : 'ndalu';
            },
            calendar: { sameDay: '[Dinten puniko pukul] LT', nextDay: '[Mbenjang pukul] LT', nextWeek: 'dddd [pukul] LT', lastDay: '[Kala wingi pukul] LT', lastWeek: 'dddd [kepengker pukul] LT', sameElse: 'L' },
            relativeTime: { future: 'wonten ing %s', past: '%s ingkang kepengker', s: 'sawetawis detik', ss: '%d detik', m: 'setunggal menit', mm: '%d menit', h: 'setunggal jam', hh: '%d jam', d: 'sedinten', dd: '%d dinten', M: 'sewulan', MM: '%d wulan', y: 'setaun', yy: '%d taun' },
            week: { dow: 1, doy: 7 },
          }),
          t.defineLocale('ka', {
            months: 'იანვარი_თებერვალი_მარტი_აპრილი_მაისი_ივნისი_ივლისი_აგვისტო_სექტემბერი_ოქტომბერი_ნოემბერი_დეკემბერი'.split('_'),
            monthsShort: 'იან_თებ_მარ_აპრ_მაი_ივნ_ივლ_აგვ_სექ_ოქტ_ნოე_დეკ'.split('_'),
            weekdays: { standalone: 'კვირა_ორშაბათი_სამშაბათი_ოთხშაბათი_ხუთშაბათი_პარასკევი_შაბათი'.split('_'), format: 'კვირას_ორშაბათს_სამშაბათს_ოთხშაბათს_ხუთშაბათს_პარასკევს_შაბათს'.split('_'), isFormat: /(\u10ec\u10d8\u10dc\u10d0|\u10e8\u10d4\u10db\u10d3\u10d4\u10d2)/ },
            weekdaysShort: 'კვი_ორშ_სამ_ოთხ_ხუთ_პარ_შაბ'.split('_'),
            weekdaysMin: 'კვ_ორ_სა_ოთ_ხუ_პა_შა'.split('_'),
            longDateFormat: { LT: 'HH:mm', LTS: 'HH:mm:ss', L: 'DD/MM/YYYY', LL: 'D MMMM YYYY', LLL: 'D MMMM YYYY HH:mm', LLLL: 'dddd, D MMMM YYYY HH:mm' },
            calendar: { sameDay: '[დღეს] LT[-ზე]', nextDay: '[ხვალ] LT[-ზე]', lastDay: '[გუშინ] LT[-ზე]', nextWeek: '[შემდეგ] dddd LT[-ზე]', lastWeek: '[წინა] dddd LT-ზე', sameElse: 'L' },
            relativeTime: {
              future: function (e) {
                return e.replace(/(\u10ec\u10d0\u10db|\u10ec\u10e3\u10d7|\u10e1\u10d0\u10d0\u10d7|\u10ec\u10d4\u10da|\u10d3\u10e6|\u10d7\u10d5)(\u10d8|\u10d4)/, function (e, a, t) {
                  return 'ი' === t ? a + 'ში' : a + t + 'ში';
                });
              },
              past: function (e) {
                return /(\u10ec\u10d0\u10db\u10d8|\u10ec\u10e3\u10d7\u10d8|\u10e1\u10d0\u10d0\u10d7\u10d8|\u10d3\u10e6\u10d4|\u10d7\u10d5\u10d4)/.test(e) ? e.replace(/(\u10d8|\u10d4)$/, 'ის წინ') : /\u10ec\u10d4\u10da\u10d8/.test(e) ? e.replace(/\u10ec\u10d4\u10da\u10d8$/, 'წლის წინ') : e;
              },
              s: 'რამდენიმე წამი',
              ss: '%d წამი',
              m: 'წუთი',
              mm: '%d წუთი',
              h: 'საათი',
              hh: '%d საათი',
              d: 'დღე',
              dd: '%d დღე',
              M: 'თვე',
              MM: '%d თვე',
              y: 'წელი',
              yy: '%d წელი',
            },
            dayOfMonthOrdinalParse: /0|1-\u10da\u10d8|\u10db\u10d4-\d{1,2}|\d{1,2}-\u10d4/,
            ordinal: function (e) {
              return 0 === e ? e : 1 === e ? e + '-ლი' : e < 20 || (e <= 100 && e % 20 == 0) || e % 100 == 0 ? 'მე-' + e : e + '-ე';
            },
            week: { dow: 1, doy: 7 },
          });
        var vn = { 0: '-ші', 1: '-ші', 2: '-ші', 3: '-ші', 4: '-ші', 5: '-ші', 6: '-шы', 7: '-ші', 8: '-ші', 9: '-шы', 10: '-шы', 20: '-шы', 30: '-шы', 40: '-шы', 50: '-ші', 60: '-шы', 70: '-ші', 80: '-ші', 90: '-шы', 100: '-ші' };
        t.defineLocale('kk', {
          months: 'қаңтар_ақпан_наурыз_сәуір_мамыр_маусым_шілде_тамыз_қыркүйек_қазан_қараша_желтоқсан'.split('_'),
          monthsShort: 'қаң_ақп_нау_сәу_мам_мау_шіл_там_қыр_қаз_қар_жел'.split('_'),
          weekdays: 'жексенбі_дүйсенбі_сейсенбі_сәрсенбі_бейсенбі_жұма_сенбі'.split('_'),
          weekdaysShort: 'жек_дүй_сей_сәр_бей_жұм_сен'.split('_'),
          weekdaysMin: 'жк_дй_сй_ср_бй_жм_сн'.split('_'),
          longDateFormat: { LT: 'HH:mm', LTS: 'HH:mm:ss', L: 'DD.MM.YYYY', LL: 'D MMMM YYYY', LLL: 'D MMMM YYYY HH:mm', LLLL: 'dddd, D MMMM YYYY HH:mm' },
          calendar: { sameDay: '[Бүгін сағат] LT', nextDay: '[Ертең сағат] LT', nextWeek: 'dddd [сағат] LT', lastDay: '[Кеше сағат] LT', lastWeek: '[Өткен аптаның] dddd [сағат] LT', sameElse: 'L' },
          relativeTime: { future: '%s ішінде', past: '%s бұрын', s: 'бірнеше секунд', ss: '%d секунд', m: 'бір минут', mm: '%d минут', h: 'бір сағат', hh: '%d сағат', d: 'бір күн', dd: '%d күн', M: 'бір ай', MM: '%d ай', y: 'бір жыл', yy: '%d жыл' },
          dayOfMonthOrdinalParse: /\d{1,2}-(\u0448\u0456|\u0448\u044b)/,
          ordinal: function (e) {
            return e + (vn[e] || vn[e % 10] || vn[100 <= e ? 100 : null]);
          },
          week: { dow: 1, doy: 7 },
        });
        var Sn = { 1: '១', 2: '២', 3: '៣', 4: '៤', 5: '៥', 6: '៦', 7: '៧', 8: '៨', 9: '៩', 0: '០' },
          Hn = { '១': '1', '២': '2', '៣': '3', '៤': '4', '៥': '5', '៦': '6', '៧': '7', '៨': '8', '៩': '9', '០': '0' };
        t.defineLocale('km', {
          months: 'មករា_កុម្ភៈ_មីនា_មេសា_ឧសភា_មិថុនា_កក្កដា_សីហា_កញ្ញា_តុលា_វិច្ឆិកា_ធ្នូ'.split('_'),
          monthsShort: 'មករា_កុម្ភៈ_មីនា_មេសា_ឧសភា_មិថុនា_កក្កដា_សីហា_កញ្ញា_តុលា_វិច្ឆិកា_ធ្នូ'.split('_'),
          weekdays: 'អាទិត្យ_ច័ន្ទ_អង្គារ_ពុធ_ព្រហស្បតិ៍_សុក្រ_សៅរ៍'.split('_'),
          weekdaysShort: 'អា_ច_អ_ព_ព្រ_សុ_ស'.split('_'),
          weekdaysMin: 'អា_ច_អ_ព_ព្រ_សុ_ស'.split('_'),
          weekdaysParseExact: !0,
          longDateFormat: { LT: 'HH:mm', LTS: 'HH:mm:ss', L: 'DD/MM/YYYY', LL: 'D MMMM YYYY', LLL: 'D MMMM YYYY HH:mm', LLLL: 'dddd, D MMMM YYYY HH:mm' },
          meridiemParse: /\u1796\u17d2\u179a\u17b9\u1780|\u179b\u17d2\u1784\u17b6\u1785/,
          isPM: function (e) {
            return 'ល្ងាច' === e;
          },
          meridiem: function (e, a, t) {
            return e < 12 ? 'ព្រឹក' : 'ល្ងាច';
          },
          calendar: { sameDay: '[ថ្ងៃនេះ ម៉ោង] LT', nextDay: '[ស្អែក ម៉ោង] LT', nextWeek: 'dddd [ម៉ោង] LT', lastDay: '[ម្សិលមិញ ម៉ោង] LT', lastWeek: 'dddd [សប្តាហ៍មុន] [ម៉ោង] LT', sameElse: 'L' },
          relativeTime: { future: '%sទៀត', past: '%sមុន', s: 'ប៉ុន្មានវិនាទី', ss: '%d វិនាទី', m: 'មួយនាទី', mm: '%d នាទី', h: 'មួយម៉ោង', hh: '%d ម៉ោង', d: 'មួយថ្ងៃ', dd: '%d ថ្ងៃ', M: 'មួយខែ', MM: '%d ខែ', y: 'មួយឆ្នាំ', yy: '%d ឆ្នាំ' },
          dayOfMonthOrdinalParse: /\u1791\u17b8\d{1,2}/,
          ordinal: 'ទី%d',
          preparse: function (e) {
            return e.replace(/[\u17e1\u17e2\u17e3\u17e4\u17e5\u17e6\u17e7\u17e8\u17e9\u17e0]/g, function (e) {
              return Hn[e];
            });
          },
          postformat: function (e) {
            return e.replace(/\d/g, function (e) {
              return Sn[e];
            });
          },
          week: { dow: 1, doy: 4 },
        });
        var jn = { 1: '೧', 2: '೨', 3: '೩', 4: '೪', 5: '೫', 6: '೬', 7: '೭', 8: '೮', 9: '೯', 0: '೦' },
          xn = { '೧': '1', '೨': '2', '೩': '3', '೪': '4', '೫': '5', '೬': '6', '೭': '7', '೮': '8', '೯': '9', '೦': '0' };
        t.defineLocale('kn', {
          months: 'ಜನವರಿ_ಫೆಬ್ರವರಿ_ಮಾರ್ಚ್_ಏಪ್ರಿಲ್_ಮೇ_ಜೂನ್_ಜುಲೈ_ಆಗಸ್ಟ್_ಸೆಪ್ಟೆಂಬರ್_ಅಕ್ಟೋಬರ್_ನವೆಂಬರ್_ಡಿಸೆಂಬರ್'.split('_'),
          monthsShort: 'ಜನ_ಫೆಬ್ರ_ಮಾರ್ಚ್_ಏಪ್ರಿಲ್_ಮೇ_ಜೂನ್_ಜುಲೈ_ಆಗಸ್ಟ್_ಸೆಪ್ಟೆಂ_ಅಕ್ಟೋ_ನವೆಂ_ಡಿಸೆಂ'.split('_'),
          monthsParseExact: !0,
          weekdays: 'ಭಾನುವಾರ_ಸೋಮವಾರ_ಮಂಗಳವಾರ_ಬುಧವಾರ_ಗುರುವಾರ_ಶುಕ್ರವಾರ_ಶನಿವಾರ'.split('_'),
          weekdaysShort: 'ಭಾನು_ಸೋಮ_ಮಂಗಳ_ಬುಧ_ಗುರು_ಶುಕ್ರ_ಶನಿ'.split('_'),
          weekdaysMin: 'ಭಾ_ಸೋ_ಮಂ_ಬು_ಗು_ಶು_ಶ'.split('_'),
          longDateFormat: { LT: 'A h:mm', LTS: 'A h:mm:ss', L: 'DD/MM/YYYY', LL: 'D MMMM YYYY', LLL: 'D MMMM YYYY, A h:mm', LLLL: 'dddd, D MMMM YYYY, A h:mm' },
          calendar: { sameDay: '[ಇಂದು] LT', nextDay: '[ನಾಳೆ] LT', nextWeek: 'dddd, LT', lastDay: '[ನಿನ್ನೆ] LT', lastWeek: '[ಕೊನೆಯ] dddd, LT', sameElse: 'L' },
          relativeTime: { future: '%s ನಂತರ', past: '%s ಹಿಂದೆ', s: 'ಕೆಲವು ಕ್ಷಣಗಳು', ss: '%d ಸೆಕೆಂಡುಗಳು', m: 'ಒಂದು ನಿಮಿಷ', mm: '%d ನಿಮಿಷ', h: 'ಒಂದು ಗಂಟೆ', hh: '%d ಗಂಟೆ', d: 'ಒಂದು ದಿನ', dd: '%d ದಿನ', M: 'ಒಂದು ತಿಂಗಳು', MM: '%d ತಿಂಗಳು', y: 'ಒಂದು ವರ್ಷ', yy: '%d ವರ್ಷ' },
          preparse: function (e) {
            return e.replace(/[\u0ce7\u0ce8\u0ce9\u0cea\u0ceb\u0cec\u0ced\u0cee\u0cef\u0ce6]/g, function (e) {
              return xn[e];
            });
          },
          postformat: function (e) {
            return e.replace(/\d/g, function (e) {
              return jn[e];
            });
          },
          meridiemParse: /\u0cb0\u0cbe\u0ca4\u0ccd\u0cb0\u0cbf|\u0cac\u0cc6\u0cb3\u0cbf\u0c97\u0ccd\u0c97\u0cc6|\u0cae\u0ca7\u0ccd\u0caf\u0cbe\u0cb9\u0ccd\u0ca8|\u0cb8\u0c82\u0c9c\u0cc6/,
          meridiemHour: function (e, a) {
            return 12 === e && (e = 0), 'ರಾತ್ರಿ' === a ? (e < 4 ? e : e + 12) : 'ಬೆಳಿಗ್ಗೆ' === a ? e : 'ಮಧ್ಯಾಹ್ನ' === a ? (10 <= e ? e : e + 12) : 'ಸಂಜೆ' === a ? e + 12 : void 0;
          },
          meridiem: function (e, a, t) {
            return e < 4 ? 'ರಾತ್ರಿ' : e < 10 ? 'ಬೆಳಿಗ್ಗೆ' : e < 17 ? 'ಮಧ್ಯಾಹ್ನ' : e < 20 ? 'ಸಂಜೆ' : 'ರಾತ್ರಿ';
          },
          dayOfMonthOrdinalParse: /\d{1,2}(\u0ca8\u0cc6\u0cd5)/,
          ordinal: function (e) {
            return e + 'ನೇ';
          },
          week: { dow: 0, doy: 6 },
        }),
          t.defineLocale('ko', {
            months: '1월_2월_3월_4월_5월_6월_7월_8월_9월_10월_11월_12월'.split('_'),
            monthsShort: '1월_2월_3월_4월_5월_6월_7월_8월_9월_10월_11월_12월'.split('_'),
            weekdays: '일요일_월요일_화요일_수요일_목요일_금요일_토요일'.split('_'),
            weekdaysShort: '일_월_화_수_목_금_토'.split('_'),
            weekdaysMin: '일_월_화_수_목_금_토'.split('_'),
            longDateFormat: { LT: 'A h:mm', LTS: 'A h:mm:ss', L: 'YYYY.MM.DD.', LL: 'YYYY년 MMMM D일', LLL: 'YYYY년 MMMM D일 A h:mm', LLLL: 'YYYY년 MMMM D일 dddd A h:mm', l: 'YYYY.MM.DD.', ll: 'YYYY년 MMMM D일', lll: 'YYYY년 MMMM D일 A h:mm', llll: 'YYYY년 MMMM D일 dddd A h:mm' },
            calendar: { sameDay: '오늘 LT', nextDay: '내일 LT', nextWeek: 'dddd LT', lastDay: '어제 LT', lastWeek: '지난주 dddd LT', sameElse: 'L' },
            relativeTime: { future: '%s 후', past: '%s 전', s: '몇 초', ss: '%d초', m: '1분', mm: '%d분', h: '한 시간', hh: '%d시간', d: '하루', dd: '%d일', M: '한 달', MM: '%d달', y: '일 년', yy: '%d년' },
            dayOfMonthOrdinalParse: /\d{1,2}(\uc77c|\uc6d4|\uc8fc)/,
            ordinal: function (e, a) {
              switch (a) {
                case 'd':
                case 'D':
                case 'DDD':
                  return e + '일';
                case 'M':
                  return e + '월';
                case 'w':
                case 'W':
                  return e + '주';
                default:
                  return e;
              }
            },
            meridiemParse: /\uc624\uc804|\uc624\ud6c4/,
            isPM: function (e) {
              return '오후' === e;
            },
            meridiem: function (e, a, t) {
              return e < 12 ? '오전' : '오후';
            },
          });
        var Pn = { 1: '١', 2: '٢', 3: '٣', 4: '٤', 5: '٥', 6: '٦', 7: '٧', 8: '٨', 9: '٩', 0: '٠' },
          On = { '١': '1', '٢': '2', '٣': '3', '٤': '4', '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9', '٠': '0' },
          Wn = ['کانونی دووەم', 'شوبات', 'ئازار', 'نیسان', 'ئایار', 'حوزەیران', 'تەمموز', 'ئاب', 'ئەیلوول', 'تشرینی یەكەم', 'تشرینی دووەم', 'كانونی یەکەم'];
        t.defineLocale('ku', {
          months: Wn,
          monthsShort: Wn,
          weekdays: 'یه‌كشه‌ممه‌_دووشه‌ممه‌_سێشه‌ممه‌_چوارشه‌ممه‌_پێنجشه‌ممه‌_هه‌ینی_شه‌ممه‌'.split('_'),
          weekdaysShort: 'یه‌كشه‌م_دووشه‌م_سێشه‌م_چوارشه‌م_پێنجشه‌م_هه‌ینی_شه‌ممه‌'.split('_'),
          weekdaysMin: 'ی_د_س_چ_پ_ه_ش'.split('_'),
          weekdaysParseExact: !0,
          longDateFormat: { LT: 'HH:mm', LTS: 'HH:mm:ss', L: 'DD/MM/YYYY', LL: 'D MMMM YYYY', LLL: 'D MMMM YYYY HH:mm', LLLL: 'dddd, D MMMM YYYY HH:mm' },
          meridiemParse: /\u0626\u06ce\u0648\u0627\u0631\u0647\u200c|\u0628\u0647\u200c\u06cc\u0627\u0646\u06cc/,
          isPM: function (e) {
            return /\u0626\u06ce\u0648\u0627\u0631\u0647\u200c/.test(e);
          },
          meridiem: function (e, a, t) {
            return e < 12 ? 'به‌یانی' : 'ئێواره‌';
          },
          calendar: { sameDay: '[ئه‌مرۆ كاتژمێر] LT', nextDay: '[به‌یانی كاتژمێر] LT', nextWeek: 'dddd [كاتژمێر] LT', lastDay: '[دوێنێ كاتژمێر] LT', lastWeek: 'dddd [كاتژمێر] LT', sameElse: 'L' },
          relativeTime: { future: 'له‌ %s', past: '%s', s: 'چه‌ند چركه‌یه‌ك', ss: 'چركه‌ %d', m: 'یه‌ك خوله‌ك', mm: '%d خوله‌ك', h: 'یه‌ك كاتژمێر', hh: '%d كاتژمێر', d: 'یه‌ك ڕۆژ', dd: '%d ڕۆژ', M: 'یه‌ك مانگ', MM: '%d مانگ', y: 'یه‌ك ساڵ', yy: '%d ساڵ' },
          preparse: function (e) {
            return e
              .replace(/[\u0661\u0662\u0663\u0664\u0665\u0666\u0667\u0668\u0669\u0660]/g, function (e) {
                return On[e];
              })
              .replace(/\u060c/g, ',');
          },
          postformat: function (e) {
            return e
              .replace(/\d/g, function (e) {
                return Pn[e];
              })
              .replace(/,/g, '،');
          },
          week: { dow: 6, doy: 12 },
        });
        var An = { 0: '-чү', 1: '-чи', 2: '-чи', 3: '-чү', 4: '-чү', 5: '-чи', 6: '-чы', 7: '-чи', 8: '-чи', 9: '-чу', 10: '-чу', 20: '-чы', 30: '-чу', 40: '-чы', 50: '-чү', 60: '-чы', 70: '-чи', 80: '-чи', 90: '-чу', 100: '-чү' };
        function En(e, a, t, s) {
          var n = { m: ['eng Minutt', 'enger Minutt'], h: ['eng Stonn', 'enger Stonn'], d: ['een Dag', 'engem Dag'], M: ['ee Mount', 'engem Mount'], y: ['ee Joer', 'engem Joer'] };
          return a ? n[t][0] : n[t][1];
        }
        function Fn(e) {
          if (((e = parseInt(e, 10)), isNaN(e))) return !1;
          if (e < 0) return !0;
          if (e < 10) return 4 <= e && e <= 7;
          if (e < 100) {
            var a = e % 10;
            return 0 == a ? Fn(e / 10) : Fn(a);
          }
          if (e < 1e4) {
            for (; 10 <= e; ) e /= 10;
            return Fn(e);
          }
          return Fn((e /= 1e3));
        }
        t.defineLocale('ky', {
          months: 'январь_февраль_март_апрель_май_июнь_июль_август_сентябрь_октябрь_ноябрь_декабрь'.split('_'),
          monthsShort: 'янв_фев_март_апр_май_июнь_июль_авг_сен_окт_ноя_дек'.split('_'),
          weekdays: 'Жекшемби_Дүйшөмбү_Шейшемби_Шаршемби_Бейшемби_Жума_Ишемби'.split('_'),
          weekdaysShort: 'Жек_Дүй_Шей_Шар_Бей_Жум_Ише'.split('_'),
          weekdaysMin: 'Жк_Дй_Шй_Шр_Бй_Жм_Иш'.split('_'),
          longDateFormat: { LT: 'HH:mm', LTS: 'HH:mm:ss', L: 'DD.MM.YYYY', LL: 'D MMMM YYYY', LLL: 'D MMMM YYYY HH:mm', LLLL: 'dddd, D MMMM YYYY HH:mm' },
          calendar: { sameDay: '[Бүгүн саат] LT', nextDay: '[Эртең саат] LT', nextWeek: 'dddd [саат] LT', lastDay: '[Кечээ саат] LT', lastWeek: '[Өткөн аптанын] dddd [күнү] [саат] LT', sameElse: 'L' },
          relativeTime: { future: '%s ичинде', past: '%s мурун', s: 'бирнече секунд', ss: '%d секунд', m: 'бир мүнөт', mm: '%d мүнөт', h: 'бир саат', hh: '%d саат', d: 'бир күн', dd: '%d күн', M: 'бир ай', MM: '%d ай', y: 'бир жыл', yy: '%d жыл' },
          dayOfMonthOrdinalParse: /\d{1,2}-(\u0447\u0438|\u0447\u044b|\u0447\u04af|\u0447\u0443)/,
          ordinal: function (e) {
            return e + (An[e] || An[e % 10] || An[100 <= e ? 100 : null]);
          },
          week: { dow: 1, doy: 7 },
        }),
          t.defineLocale('lb', {
            months: 'Januar_Februar_Mäerz_Abrëll_Mee_Juni_Juli_August_September_Oktober_November_Dezember'.split('_'),
            monthsShort: 'Jan._Febr._Mrz._Abr._Mee_Jun._Jul._Aug._Sept._Okt._Nov._Dez.'.split('_'),
            monthsParseExact: !0,
            weekdays: 'Sonndeg_Méindeg_Dënschdeg_Mëttwoch_Donneschdeg_Freideg_Samschdeg'.split('_'),
            weekdaysShort: 'So._Mé._Dë._Më._Do._Fr._Sa.'.split('_'),
            weekdaysMin: 'So_Mé_Dë_Më_Do_Fr_Sa'.split('_'),
            weekdaysParseExact: !0,
            longDateFormat: { LT: 'H:mm [Auer]', LTS: 'H:mm:ss [Auer]', L: 'DD.MM.YYYY', LL: 'D. MMMM YYYY', LLL: 'D. MMMM YYYY H:mm [Auer]', LLLL: 'dddd, D. MMMM YYYY H:mm [Auer]' },
            calendar: {
              sameDay: '[Haut um] LT',
              sameElse: 'L',
              nextDay: '[Muer um] LT',
              nextWeek: 'dddd [um] LT',
              lastDay: '[Gëschter um] LT',
              lastWeek: function () {
                switch (this.day()) {
                  case 2:
                  case 4:
                    return '[Leschten] dddd [um] LT';
                  default:
                    return '[Leschte] dddd [um] LT';
                }
              },
            },
            relativeTime: {
              future: function (e) {
                return Fn(e.substr(0, e.indexOf(' '))) ? 'a ' + e : 'an ' + e;
              },
              past: function (e) {
                return Fn(e.substr(0, e.indexOf(' '))) ? 'viru ' + e : 'virun ' + e;
              },
              s: 'e puer Sekonnen',
              ss: '%d Sekonnen',
              m: En,
              mm: '%d Minutten',
              h: En,
              hh: '%d Stonnen',
              d: En,
              dd: '%d Deeg',
              M: En,
              MM: '%d Méint',
              y: En,
              yy: '%d Joer',
            },
            dayOfMonthOrdinalParse: /\d{1,2}\./,
            ordinal: '%d.',
            week: { dow: 1, doy: 4 },
          }),
          t.defineLocale('lo', {
            months: 'ມັງກອນ_ກຸມພາ_ມີນາ_ເມສາ_ພຶດສະພາ_ມິຖຸນາ_ກໍລະກົດ_ສິງຫາ_ກັນຍາ_ຕຸລາ_ພະຈິກ_ທັນວາ'.split('_'),
            monthsShort: 'ມັງກອນ_ກຸມພາ_ມີນາ_ເມສາ_ພຶດສະພາ_ມິຖຸນາ_ກໍລະກົດ_ສິງຫາ_ກັນຍາ_ຕຸລາ_ພະຈິກ_ທັນວາ'.split('_'),
            weekdays: 'ອາທິດ_ຈັນ_ອັງຄານ_ພຸດ_ພະຫັດ_ສຸກ_ເສົາ'.split('_'),
            weekdaysShort: 'ທິດ_ຈັນ_ອັງຄານ_ພຸດ_ພະຫັດ_ສຸກ_ເສົາ'.split('_'),
            weekdaysMin: 'ທ_ຈ_ອຄ_ພ_ພຫ_ສກ_ສ'.split('_'),
            weekdaysParseExact: !0,
            longDateFormat: { LT: 'HH:mm', LTS: 'HH:mm:ss', L: 'DD/MM/YYYY', LL: 'D MMMM YYYY', LLL: 'D MMMM YYYY HH:mm', LLLL: 'ວັນdddd D MMMM YYYY HH:mm' },
            meridiemParse: /\u0e95\u0ead\u0e99\u0ec0\u0e8a\u0ebb\u0ec9\u0eb2|\u0e95\u0ead\u0e99\u0ec1\u0ea5\u0e87/,
            isPM: function (e) {
              return 'ຕອນແລງ' === e;
            },
            meridiem: function (e, a, t) {
              return e < 12 ? 'ຕອນເຊົ້າ' : 'ຕອນແລງ';
            },
            calendar: { sameDay: '[ມື້ນີ້ເວລາ] LT', nextDay: '[ມື້ອື່ນເວລາ] LT', nextWeek: '[ວັນ]dddd[ໜ້າເວລາ] LT', lastDay: '[ມື້ວານນີ້ເວລາ] LT', lastWeek: '[ວັນ]dddd[ແລ້ວນີ້ເວລາ] LT', sameElse: 'L' },
            relativeTime: { future: 'ອີກ %s', past: '%sຜ່ານມາ', s: 'ບໍ່ເທົ່າໃດວິນາທີ', ss: '%d ວິນາທີ', m: '1 ນາທີ', mm: '%d ນາທີ', h: '1 ຊົ່ວໂມງ', hh: '%d ຊົ່ວໂມງ', d: '1 ມື້', dd: '%d ມື້', M: '1 ເດືອນ', MM: '%d ເດືອນ', y: '1 ປີ', yy: '%d ປີ' },
            dayOfMonthOrdinalParse: /(\u0e97\u0eb5\u0ec8)\d{1,2}/,
            ordinal: function (e) {
              return 'ທີ່' + e;
            },
          });
        var zn = {
          ss: 'sekundė_sekundžių_sekundes',
          m: 'minutė_minutės_minutę',
          mm: 'minutės_minučių_minutes',
          h: 'valanda_valandos_valandą',
          hh: 'valandos_valandų_valandas',
          d: 'diena_dienos_dieną',
          dd: 'dienos_dienų_dienas',
          M: 'mėnuo_mėnesio_mėnesį',
          MM: 'mėnesiai_mėnesių_mėnesius',
          y: 'metai_metų_metus',
          yy: 'metai_metų_metus',
        };
        function Nn(e, a, t, s) {
          return a ? Rn(t)[0] : s ? Rn(t)[1] : Rn(t)[2];
        }
        function Jn(e) {
          return e % 10 == 0 || (10 < e && e < 20);
        }
        function Rn(e) {
          return zn[e].split('_');
        }
        function Cn(e, a, t, s) {
          var n = e + ' ';
          return 1 === e ? n + Nn(0, a, t[0], s) : a ? n + (Jn(e) ? Rn(t)[1] : Rn(t)[0]) : s ? n + Rn(t)[1] : n + (Jn(e) ? Rn(t)[1] : Rn(t)[2]);
        }
        t.defineLocale('lt', {
          months: {
            format: 'sausio_vasario_kovo_balandžio_gegužės_birželio_liepos_rugpjūčio_rugsėjo_spalio_lapkričio_gruodžio'.split('_'),
            standalone: 'sausis_vasaris_kovas_balandis_gegužė_birželis_liepa_rugpjūtis_rugsėjis_spalis_lapkritis_gruodis'.split('_'),
            isFormat: /D[oD]?(\[[^\[\]]*\]|\s)+MMMM?|MMMM?(\[[^\[\]]*\]|\s)+D[oD]?/,
          },
          monthsShort: 'sau_vas_kov_bal_geg_bir_lie_rgp_rgs_spa_lap_grd'.split('_'),
          weekdays: { format: 'sekmadienį_pirmadienį_antradienį_trečiadienį_ketvirtadienį_penktadienį_šeštadienį'.split('_'), standalone: 'sekmadienis_pirmadienis_antradienis_trečiadienis_ketvirtadienis_penktadienis_šeštadienis'.split('_'), isFormat: /dddd HH:mm/ },
          weekdaysShort: 'Sek_Pir_Ant_Tre_Ket_Pen_Šeš'.split('_'),
          weekdaysMin: 'S_P_A_T_K_Pn_Š'.split('_'),
          weekdaysParseExact: !0,
          longDateFormat: {
            LT: 'HH:mm',
            LTS: 'HH:mm:ss',
            L: 'YYYY-MM-DD',
            LL: 'YYYY [m.] MMMM D [d.]',
            LLL: 'YYYY [m.] MMMM D [d.], HH:mm [val.]',
            LLLL: 'YYYY [m.] MMMM D [d.], dddd, HH:mm [val.]',
            l: 'YYYY-MM-DD',
            ll: 'YYYY [m.] MMMM D [d.]',
            lll: 'YYYY [m.] MMMM D [d.], HH:mm [val.]',
            llll: 'YYYY [m.] MMMM D [d.], ddd, HH:mm [val.]',
          },
          calendar: { sameDay: '[Šiandien] LT', nextDay: '[Rytoj] LT', nextWeek: 'dddd LT', lastDay: '[Vakar] LT', lastWeek: '[Praėjusį] dddd LT', sameElse: 'L' },
          relativeTime: {
            future: 'po %s',
            past: 'prieš %s',
            s: function (e, a, t, s) {
              return a ? 'kelios sekundės' : s ? 'kelių sekundžių' : 'kelias sekundes';
            },
            ss: Cn,
            m: Nn,
            mm: Cn,
            h: Nn,
            hh: Cn,
            d: Nn,
            dd: Cn,
            M: Nn,
            MM: Cn,
            y: Nn,
            yy: Cn,
          },
          dayOfMonthOrdinalParse: /\d{1,2}-oji/,
          ordinal: function (e) {
            return e + '-oji';
          },
          week: { dow: 1, doy: 4 },
        });
        var In = {
          ss: 'sekundes_sekundēm_sekunde_sekundes'.split('_'),
          m: 'minūtes_minūtēm_minūte_minūtes'.split('_'),
          mm: 'minūtes_minūtēm_minūte_minūtes'.split('_'),
          h: 'stundas_stundām_stunda_stundas'.split('_'),
          hh: 'stundas_stundām_stunda_stundas'.split('_'),
          d: 'dienas_dienām_diena_dienas'.split('_'),
          dd: 'dienas_dienām_diena_dienas'.split('_'),
          M: 'mēneša_mēnešiem_mēnesis_mēneši'.split('_'),
          MM: 'mēneša_mēnešiem_mēnesis_mēneši'.split('_'),
          y: 'gada_gadiem_gads_gadi'.split('_'),
          yy: 'gada_gadiem_gads_gadi'.split('_'),
        };
        function Un(e, a, t) {
          return t ? (a % 10 == 1 && a % 100 != 11 ? e[2] : e[3]) : a % 10 == 1 && a % 100 != 11 ? e[0] : e[1];
        }
        function Gn(e, a, t) {
          return e + ' ' + Un(In[t], e, a);
        }
        function Vn(e, a, t) {
          return Un(In[t], e, a);
        }
        t.defineLocale('lv', {
          months: 'janvāris_februāris_marts_aprīlis_maijs_jūnijs_jūlijs_augusts_septembris_oktobris_novembris_decembris'.split('_'),
          monthsShort: 'jan_feb_mar_apr_mai_jūn_jūl_aug_sep_okt_nov_dec'.split('_'),
          weekdays: 'svētdiena_pirmdiena_otrdiena_trešdiena_ceturtdiena_piektdiena_sestdiena'.split('_'),
          weekdaysShort: 'Sv_P_O_T_C_Pk_S'.split('_'),
          weekdaysMin: 'Sv_P_O_T_C_Pk_S'.split('_'),
          weekdaysParseExact: !0,
          longDateFormat: { LT: 'HH:mm', LTS: 'HH:mm:ss', L: 'DD.MM.YYYY.', LL: 'YYYY. [gada] D. MMMM', LLL: 'YYYY. [gada] D. MMMM, HH:mm', LLLL: 'YYYY. [gada] D. MMMM, dddd, HH:mm' },
          calendar: { sameDay: '[Šodien pulksten] LT', nextDay: '[Rīt pulksten] LT', nextWeek: 'dddd [pulksten] LT', lastDay: '[Vakar pulksten] LT', lastWeek: '[Pagājušā] dddd [pulksten] LT', sameElse: 'L' },
          relativeTime: {
            future: 'pēc %s',
            past: 'pirms %s',
            s: function (e, a) {
              return a ? 'dažas sekundes' : 'dažām sekundēm';
            },
            ss: Gn,
            m: Vn,
            mm: Gn,
            h: Vn,
            hh: Gn,
            d: Vn,
            dd: Gn,
            M: Vn,
            MM: Gn,
            y: Vn,
            yy: Gn,
          },
          dayOfMonthOrdinalParse: /\d{1,2}\./,
          ordinal: '%d.',
          week: { dow: 1, doy: 4 },
        });
        var Bn = {
          words: { ss: ['sekund', 'sekunda', 'sekundi'], m: ['jedan minut', 'jednog minuta'], mm: ['minut', 'minuta', 'minuta'], h: ['jedan sat', 'jednog sata'], hh: ['sat', 'sata', 'sati'], dd: ['dan', 'dana', 'dana'], MM: ['mjesec', 'mjeseca', 'mjeseci'], yy: ['godina', 'godine', 'godina'] },
          correctGrammaticalCase: function (e, a) {
            return 1 === e ? a[0] : 2 <= e && e <= 4 ? a[1] : a[2];
          },
          translate: function (e, a, t) {
            var s = Bn.words[t];
            return 1 === t.length ? (a ? s[0] : s[1]) : e + ' ' + Bn.correctGrammaticalCase(e, s);
          },
        };
        function Kn(e, a, t, s) {
          switch (t) {
            case 's':
              return a ? 'хэдхэн секунд' : 'хэдхэн секундын';
            case 'ss':
              return e + (a ? ' секунд' : ' секундын');
            case 'm':
            case 'mm':
              return e + (a ? ' минут' : ' минутын');
            case 'h':
            case 'hh':
              return e + (a ? ' цаг' : ' цагийн');
            case 'd':
            case 'dd':
              return e + (a ? ' өдөр' : ' өдрийн');
            case 'M':
            case 'MM':
              return e + (a ? ' сар' : ' сарын');
            case 'y':
            case 'yy':
              return e + (a ? ' жил' : ' жилийн');
            default:
              return e;
          }
        }
        t.defineLocale('me', {
          months: 'januar_februar_mart_april_maj_jun_jul_avgust_septembar_oktobar_novembar_decembar'.split('_'),
          monthsShort: 'jan._feb._mar._apr._maj_jun_jul_avg._sep._okt._nov._dec.'.split('_'),
          monthsParseExact: !0,
          weekdays: 'nedjelja_ponedjeljak_utorak_srijeda_četvrtak_petak_subota'.split('_'),
          weekdaysShort: 'ned._pon._uto._sri._čet._pet._sub.'.split('_'),
          weekdaysMin: 'ne_po_ut_sr_če_pe_su'.split('_'),
          weekdaysParseExact: !0,
          longDateFormat: { LT: 'H:mm', LTS: 'H:mm:ss', L: 'DD.MM.YYYY', LL: 'D. MMMM YYYY', LLL: 'D. MMMM YYYY H:mm', LLLL: 'dddd, D. MMMM YYYY H:mm' },
          calendar: {
            sameDay: '[danas u] LT',
            nextDay: '[sjutra u] LT',
            nextWeek: function () {
              switch (this.day()) {
                case 0:
                  return '[u] [nedjelju] [u] LT';
                case 3:
                  return '[u] [srijedu] [u] LT';
                case 6:
                  return '[u] [subotu] [u] LT';
                case 1:
                case 2:
                case 4:
                case 5:
                  return '[u] dddd [u] LT';
              }
            },
            lastDay: '[juče u] LT',
            lastWeek: function () {
              return ['[prošle] [nedjelje] [u] LT', '[prošlog] [ponedjeljka] [u] LT', '[prošlog] [utorka] [u] LT', '[prošle] [srijede] [u] LT', '[prošlog] [četvrtka] [u] LT', '[prošlog] [petka] [u] LT', '[prošle] [subote] [u] LT'][this.day()];
            },
            sameElse: 'L',
          },
          relativeTime: { future: 'za %s', past: 'prije %s', s: 'nekoliko sekundi', ss: Bn.translate, m: Bn.translate, mm: Bn.translate, h: Bn.translate, hh: Bn.translate, d: 'dan', dd: Bn.translate, M: 'mjesec', MM: Bn.translate, y: 'godinu', yy: Bn.translate },
          dayOfMonthOrdinalParse: /\d{1,2}\./,
          ordinal: '%d.',
          week: { dow: 1, doy: 7 },
        }),
          t.defineLocale('mi', {
            months: 'Kohi-tāte_Hui-tanguru_Poutū-te-rangi_Paenga-whāwhā_Haratua_Pipiri_Hōngoingoi_Here-turi-kōkā_Mahuru_Whiringa-ā-nuku_Whiringa-ā-rangi_Hakihea'.split('_'),
            monthsShort: 'Kohi_Hui_Pou_Pae_Hara_Pipi_Hōngoi_Here_Mahu_Whi-nu_Whi-ra_Haki'.split('_'),
            monthsRegex: /(?:['a-z\u0101\u014D\u016B]+\-?){1,3}/i,
            monthsStrictRegex: /(?:['a-z\u0101\u014D\u016B]+\-?){1,3}/i,
            monthsShortRegex: /(?:['a-z\u0101\u014D\u016B]+\-?){1,3}/i,
            monthsShortStrictRegex: /(?:['a-z\u0101\u014D\u016B]+\-?){1,2}/i,
            weekdays: 'Rātapu_Mane_Tūrei_Wenerei_Tāite_Paraire_Hātarei'.split('_'),
            weekdaysShort: 'Ta_Ma_Tū_We_Tāi_Pa_Hā'.split('_'),
            weekdaysMin: 'Ta_Ma_Tū_We_Tāi_Pa_Hā'.split('_'),
            longDateFormat: { LT: 'HH:mm', LTS: 'HH:mm:ss', L: 'DD/MM/YYYY', LL: 'D MMMM YYYY', LLL: 'D MMMM YYYY [i] HH:mm', LLLL: 'dddd, D MMMM YYYY [i] HH:mm' },
            calendar: { sameDay: '[i teie mahana, i] LT', nextDay: '[apopo i] LT', nextWeek: 'dddd [i] LT', lastDay: '[inanahi i] LT', lastWeek: 'dddd [whakamutunga i] LT', sameElse: 'L' },
            relativeTime: { future: 'i roto i %s', past: '%s i mua', s: 'te hēkona ruarua', ss: '%d hēkona', m: 'he meneti', mm: '%d meneti', h: 'te haora', hh: '%d haora', d: 'he ra', dd: '%d ra', M: 'he marama', MM: '%d marama', y: 'he tau', yy: '%d tau' },
            dayOfMonthOrdinalParse: /\d{1,2}\xba/,
            ordinal: '%dº',
            week: { dow: 1, doy: 4 },
          }),
          t.defineLocale('mk', {
            months: 'јануари_февруари_март_април_мај_јуни_јули_август_септември_октомври_ноември_декември'.split('_'),
            monthsShort: 'јан_фев_мар_апр_мај_јун_јул_авг_сеп_окт_ное_дек'.split('_'),
            weekdays: 'недела_понеделник_вторник_среда_четврток_петок_сабота'.split('_'),
            weekdaysShort: 'нед_пон_вто_сре_чет_пет_саб'.split('_'),
            weekdaysMin: 'нe_пo_вт_ср_че_пе_сa'.split('_'),
            longDateFormat: { LT: 'H:mm', LTS: 'H:mm:ss', L: 'D.MM.YYYY', LL: 'D MMMM YYYY', LLL: 'D MMMM YYYY H:mm', LLLL: 'dddd, D MMMM YYYY H:mm' },
            calendar: {
              sameDay: '[Денес во] LT',
              nextDay: '[Утре во] LT',
              nextWeek: '[Во] dddd [во] LT',
              lastDay: '[Вчера во] LT',
              lastWeek: function () {
                switch (this.day()) {
                  case 0:
                  case 3:
                  case 6:
                    return '[Изминатата] dddd [во] LT';
                  case 1:
                  case 2:
                  case 4:
                  case 5:
                    return '[Изминатиот] dddd [во] LT';
                }
              },
              sameElse: 'L',
            },
            relativeTime: { future: 'за %s', past: 'пред %s', s: 'неколку секунди', ss: '%d секунди', m: 'една минута', mm: '%d минути', h: 'еден час', hh: '%d часа', d: 'еден ден', dd: '%d дена', M: 'еден месец', MM: '%d месеци', y: 'една година', yy: '%d години' },
            dayOfMonthOrdinalParse: /\d{1,2}-(\u0435\u0432|\u0435\u043d|\u0442\u0438|\u0432\u0438|\u0440\u0438|\u043c\u0438)/,
            ordinal: function (e) {
              var a = e % 10,
                t = e % 100;
              return 0 === e ? e + '-ев' : 0 == t ? e + '-ен' : 10 < t && t < 20 ? e + '-ти' : 1 == a ? e + '-ви' : 2 == a ? e + '-ри' : 7 == a || 8 == a ? e + '-ми' : e + '-ти';
            },
            week: { dow: 1, doy: 7 },
          }),
          t.defineLocale('ml', {
            months: 'ജനുവരി_ഫെബ്രുവരി_മാർച്ച്_ഏപ്രിൽ_മേയ്_ജൂൺ_ജൂലൈ_ഓഗസ്റ്റ്_സെപ്റ്റംബർ_ഒക്ടോബർ_നവംബർ_ഡിസംബർ'.split('_'),
            monthsShort: 'ജനു._ഫെബ്രു._മാർ._ഏപ്രി._മേയ്_ജൂൺ_ജൂലൈ._ഓഗ._സെപ്റ്റ._ഒക്ടോ._നവം._ഡിസം.'.split('_'),
            monthsParseExact: !0,
            weekdays: 'ഞായറാഴ്ച_തിങ്കളാഴ്ച_ചൊവ്വാഴ്ച_ബുധനാഴ്ച_വ്യാഴാഴ്ച_വെള്ളിയാഴ്ച_ശനിയാഴ്ച'.split('_'),
            weekdaysShort: 'ഞായർ_തിങ്കൾ_ചൊവ്വ_ബുധൻ_വ്യാഴം_വെള്ളി_ശനി'.split('_'),
            weekdaysMin: 'ഞാ_തി_ചൊ_ബു_വ്യാ_വെ_ശ'.split('_'),
            longDateFormat: { LT: 'A h:mm -നു', LTS: 'A h:mm:ss -നു', L: 'DD/MM/YYYY', LL: 'D MMMM YYYY', LLL: 'D MMMM YYYY, A h:mm -നു', LLLL: 'dddd, D MMMM YYYY, A h:mm -നു' },
            calendar: { sameDay: '[ഇന്ന്] LT', nextDay: '[നാളെ] LT', nextWeek: 'dddd, LT', lastDay: '[ഇന്നലെ] LT', lastWeek: '[കഴിഞ്ഞ] dddd, LT', sameElse: 'L' },
            relativeTime: { future: '%s കഴിഞ്ഞ്', past: '%s മുൻപ്', s: 'അൽപ നിമിഷങ്ങൾ', ss: '%d സെക്കൻഡ്', m: 'ഒരു മിനിറ്റ്', mm: '%d മിനിറ്റ്', h: 'ഒരു മണിക്കൂർ', hh: '%d മണിക്കൂർ', d: 'ഒരു ദിവസം', dd: '%d ദിവസം', M: 'ഒരു മാസം', MM: '%d മാസം', y: 'ഒരു വർഷം', yy: '%d വർഷം' },
            meridiemParse: /\u0d30\u0d3e\u0d24\u0d4d\u0d30\u0d3f|\u0d30\u0d3e\u0d35\u0d3f\u0d32\u0d46|\u0d09\u0d1a\u0d4d\u0d1a \u0d15\u0d34\u0d3f\u0d1e\u0d4d\u0d1e\u0d4d|\u0d35\u0d48\u0d15\u0d41\u0d28\u0d4d\u0d28\u0d47\u0d30\u0d02|\u0d30\u0d3e\u0d24\u0d4d\u0d30\u0d3f/i,
            meridiemHour: function (e, a) {
              return 12 === e && (e = 0), ('രാത്രി' === a && 4 <= e) || 'ഉച്ച കഴിഞ്ഞ്' === a || 'വൈകുന്നേരം' === a ? e + 12 : e;
            },
            meridiem: function (e, a, t) {
              return e < 4 ? 'രാത്രി' : e < 12 ? 'രാവിലെ' : e < 17 ? 'ഉച്ച കഴിഞ്ഞ്' : e < 20 ? 'വൈകുന്നേരം' : 'രാത്രി';
            },
          }),
          t.defineLocale('mn', {
            months: 'Нэгдүгээр сар_Хоёрдугаар сар_Гуравдугаар сар_Дөрөвдүгээр сар_Тавдугаар сар_Зургадугаар сар_Долдугаар сар_Наймдугаар сар_Есдүгээр сар_Аравдугаар сар_Арван нэгдүгээр сар_Арван хоёрдугаар сар'.split('_'),
            monthsShort: '1 сар_2 сар_3 сар_4 сар_5 сар_6 сар_7 сар_8 сар_9 сар_10 сар_11 сар_12 сар'.split('_'),
            monthsParseExact: !0,
            weekdays: 'Ням_Даваа_Мягмар_Лхагва_Пүрэв_Баасан_Бямба'.split('_'),
            weekdaysShort: 'Ням_Дав_Мяг_Лха_Пүр_Баа_Бям'.split('_'),
            weekdaysMin: 'Ня_Да_Мя_Лх_Пү_Ба_Бя'.split('_'),
            weekdaysParseExact: !0,
            longDateFormat: { LT: 'HH:mm', LTS: 'HH:mm:ss', L: 'YYYY-MM-DD', LL: 'YYYY оны MMMMын D', LLL: 'YYYY оны MMMMын D HH:mm', LLLL: 'dddd, YYYY оны MMMMын D HH:mm' },
            meridiemParse: /\u04ae\u04e8|\u04ae\u0425/i,
            isPM: function (e) {
              return 'ҮХ' === e;
            },
            meridiem: function (e, a, t) {
              return e < 12 ? 'ҮӨ' : 'ҮХ';
            },
            calendar: { sameDay: '[Өнөөдөр] LT', nextDay: '[Маргааш] LT', nextWeek: '[Ирэх] dddd LT', lastDay: '[Өчигдөр] LT', lastWeek: '[Өнгөрсөн] dddd LT', sameElse: 'L' },
            relativeTime: { future: '%s дараа', past: '%s өмнө', s: Kn, ss: Kn, m: Kn, mm: Kn, h: Kn, hh: Kn, d: Kn, dd: Kn, M: Kn, MM: Kn, y: Kn, yy: Kn },
            dayOfMonthOrdinalParse: /\d{1,2} \u04e9\u0434\u04e9\u0440/,
            ordinal: function (e, a) {
              switch (a) {
                case 'd':
                case 'D':
                case 'DDD':
                  return e + ' өдөр';
                default:
                  return e;
              }
            },
          });
        var qn = { 1: '१', 2: '२', 3: '३', 4: '४', 5: '५', 6: '६', 7: '७', 8: '८', 9: '९', 0: '०' },
          Zn = { '१': '1', '२': '2', '३': '3', '४': '4', '५': '5', '६': '6', '७': '7', '८': '8', '९': '9', '०': '0' };
        function $n(e, a, t, s) {
          var n = '';
          if (a)
            switch (t) {
              case 's':
                n = 'काही सेकंद';
                break;
              case 'ss':
                n = '%d सेकंद';
                break;
              case 'm':
                n = 'एक मिनिट';
                break;
              case 'mm':
                n = '%d मिनिटे';
                break;
              case 'h':
                n = 'एक तास';
                break;
              case 'hh':
                n = '%d तास';
                break;
              case 'd':
                n = 'एक दिवस';
                break;
              case 'dd':
                n = '%d दिवस';
                break;
              case 'M':
                n = 'एक महिना';
                break;
              case 'MM':
                n = '%d महिने';
                break;
              case 'y':
                n = 'एक वर्ष';
                break;
              case 'yy':
                n = '%d वर्षे';
                break;
            }
          else
            switch (t) {
              case 's':
                n = 'काही सेकंदां';
                break;
              case 'ss':
                n = '%d सेकंदां';
                break;
              case 'm':
                n = 'एका मिनिटा';
                break;
              case 'mm':
                n = '%d मिनिटां';
                break;
              case 'h':
                n = 'एका तासा';
                break;
              case 'hh':
                n = '%d तासां';
                break;
              case 'd':
                n = 'एका दिवसा';
                break;
              case 'dd':
                n = '%d दिवसां';
                break;
              case 'M':
                n = 'एका महिन्या';
                break;
              case 'MM':
                n = '%d महिन्यां';
                break;
              case 'y':
                n = 'एका वर्षा';
                break;
              case 'yy':
                n = '%d वर्षां';
                break;
            }
          return n.replace(/%d/i, e);
        }
        t.defineLocale('mr', {
          months: 'जानेवारी_फेब्रुवारी_मार्च_एप्रिल_मे_जून_जुलै_ऑगस्ट_सप्टेंबर_ऑक्टोबर_नोव्हेंबर_डिसेंबर'.split('_'),
          monthsShort: 'जाने._फेब्रु._मार्च._एप्रि._मे._जून._जुलै._ऑग._सप्टें._ऑक्टो._नोव्हें._डिसें.'.split('_'),
          monthsParseExact: !0,
          weekdays: 'रविवार_सोमवार_मंगळवार_बुधवार_गुरूवार_शुक्रवार_शनिवार'.split('_'),
          weekdaysShort: 'रवि_सोम_मंगळ_बुध_गुरू_शुक्र_शनि'.split('_'),
          weekdaysMin: 'र_सो_मं_बु_गु_शु_श'.split('_'),
          longDateFormat: { LT: 'A h:mm वाजता', LTS: 'A h:mm:ss वाजता', L: 'DD/MM/YYYY', LL: 'D MMMM YYYY', LLL: 'D MMMM YYYY, A h:mm वाजता', LLLL: 'dddd, D MMMM YYYY, A h:mm वाजता' },
          calendar: { sameDay: '[आज] LT', nextDay: '[उद्या] LT', nextWeek: 'dddd, LT', lastDay: '[काल] LT', lastWeek: '[मागील] dddd, LT', sameElse: 'L' },
          relativeTime: { future: '%sमध्ये', past: '%sपूर्वी', s: $n, ss: $n, m: $n, mm: $n, h: $n, hh: $n, d: $n, dd: $n, M: $n, MM: $n, y: $n, yy: $n },
          preparse: function (e) {
            return e.replace(/[\u0967\u0968\u0969\u096a\u096b\u096c\u096d\u096e\u096f\u0966]/g, function (e) {
              return Zn[e];
            });
          },
          postformat: function (e) {
            return e.replace(/\d/g, function (e) {
              return qn[e];
            });
          },
          meridiemParse: /\u092a\u0939\u093e\u091f\u0947|\u0938\u0915\u093e\u0933\u0940|\u0926\u0941\u092a\u093e\u0930\u0940|\u0938\u093e\u092f\u0902\u0915\u093e\u0933\u0940|\u0930\u093e\u0924\u094d\u0930\u0940/,
          meridiemHour: function (e, a) {
            return 12 === e && (e = 0), 'पहाटे' === a || 'सकाळी' === a ? e : 'दुपारी' === a || 'सायंकाळी' === a || 'रात्री' === a ? (12 <= e ? e : e + 12) : void 0;
          },
          meridiem: function (e, a, t) {
            return 0 <= e && e < 6 ? 'पहाटे' : e < 12 ? 'सकाळी' : e < 17 ? 'दुपारी' : e < 20 ? 'सायंकाळी' : 'रात्री';
          },
          week: { dow: 0, doy: 6 },
        }),
          t.defineLocale('ms-my', {
            months: 'Januari_Februari_Mac_April_Mei_Jun_Julai_Ogos_September_Oktober_November_Disember'.split('_'),
            monthsShort: 'Jan_Feb_Mac_Apr_Mei_Jun_Jul_Ogs_Sep_Okt_Nov_Dis'.split('_'),
            weekdays: 'Ahad_Isnin_Selasa_Rabu_Khamis_Jumaat_Sabtu'.split('_'),
            weekdaysShort: 'Ahd_Isn_Sel_Rab_Kha_Jum_Sab'.split('_'),
            weekdaysMin: 'Ah_Is_Sl_Rb_Km_Jm_Sb'.split('_'),
            longDateFormat: { LT: 'HH.mm', LTS: 'HH.mm.ss', L: 'DD/MM/YYYY', LL: 'D MMMM YYYY', LLL: 'D MMMM YYYY [pukul] HH.mm', LLLL: 'dddd, D MMMM YYYY [pukul] HH.mm' },
            meridiemParse: /pagi|tengahari|petang|malam/,
            meridiemHour: function (e, a) {
              return 12 === e && (e = 0), 'pagi' === a ? e : 'tengahari' === a ? (11 <= e ? e : e + 12) : 'petang' === a || 'malam' === a ? e + 12 : void 0;
            },
            meridiem: function (e, a, t) {
              return e < 11 ? 'pagi' : e < 15 ? 'tengahari' : e < 19 ? 'petang' : 'malam';
            },
            calendar: { sameDay: '[Hari ini pukul] LT', nextDay: '[Esok pukul] LT', nextWeek: 'dddd [pukul] LT', lastDay: '[Kelmarin pukul] LT', lastWeek: 'dddd [lepas pukul] LT', sameElse: 'L' },
            relativeTime: { future: 'dalam %s', past: '%s yang lepas', s: 'beberapa saat', ss: '%d saat', m: 'seminit', mm: '%d minit', h: 'sejam', hh: '%d jam', d: 'sehari', dd: '%d hari', M: 'sebulan', MM: '%d bulan', y: 'setahun', yy: '%d tahun' },
            week: { dow: 1, doy: 7 },
          }),
          t.defineLocale('ms', {
            months: 'Januari_Februari_Mac_April_Mei_Jun_Julai_Ogos_September_Oktober_November_Disember'.split('_'),
            monthsShort: 'Jan_Feb_Mac_Apr_Mei_Jun_Jul_Ogs_Sep_Okt_Nov_Dis'.split('_'),
            weekdays: 'Ahad_Isnin_Selasa_Rabu_Khamis_Jumaat_Sabtu'.split('_'),
            weekdaysShort: 'Ahd_Isn_Sel_Rab_Kha_Jum_Sab'.split('_'),
            weekdaysMin: 'Ah_Is_Sl_Rb_Km_Jm_Sb'.split('_'),
            longDateFormat: { LT: 'HH.mm', LTS: 'HH.mm.ss', L: 'DD/MM/YYYY', LL: 'D MMMM YYYY', LLL: 'D MMMM YYYY [pukul] HH.mm', LLLL: 'dddd, D MMMM YYYY [pukul] HH.mm' },
            meridiemParse: /pagi|tengahari|petang|malam/,
            meridiemHour: function (e, a) {
              return 12 === e && (e = 0), 'pagi' === a ? e : 'tengahari' === a ? (11 <= e ? e : e + 12) : 'petang' === a || 'malam' === a ? e + 12 : void 0;
            },
            meridiem: function (e, a, t) {
              return e < 11 ? 'pagi' : e < 15 ? 'tengahari' : e < 19 ? 'petang' : 'malam';
            },
            calendar: { sameDay: '[Hari ini pukul] LT', nextDay: '[Esok pukul] LT', nextWeek: 'dddd [pukul] LT', lastDay: '[Kelmarin pukul] LT', lastWeek: 'dddd [lepas pukul] LT', sameElse: 'L' },
            relativeTime: { future: 'dalam %s', past: '%s yang lepas', s: 'beberapa saat', ss: '%d saat', m: 'seminit', mm: '%d minit', h: 'sejam', hh: '%d jam', d: 'sehari', dd: '%d hari', M: 'sebulan', MM: '%d bulan', y: 'setahun', yy: '%d tahun' },
            week: { dow: 1, doy: 7 },
          }),
          t.defineLocale('mt', {
            months: 'Jannar_Frar_Marzu_April_Mejju_Ġunju_Lulju_Awwissu_Settembru_Ottubru_Novembru_Diċembru'.split('_'),
            monthsShort: 'Jan_Fra_Mar_Apr_Mej_Ġun_Lul_Aww_Set_Ott_Nov_Diċ'.split('_'),
            weekdays: 'Il-Ħadd_It-Tnejn_It-Tlieta_L-Erbgħa_Il-Ħamis_Il-Ġimgħa_Is-Sibt'.split('_'),
            weekdaysShort: 'Ħad_Tne_Tli_Erb_Ħam_Ġim_Sib'.split('_'),
            weekdaysMin: 'Ħa_Tn_Tl_Er_Ħa_Ġi_Si'.split('_'),
            longDateFormat: { LT: 'HH:mm', LTS: 'HH:mm:ss', L: 'DD/MM/YYYY', LL: 'D MMMM YYYY', LLL: 'D MMMM YYYY HH:mm', LLLL: 'dddd, D MMMM YYYY HH:mm' },
            calendar: { sameDay: '[Illum fil-]LT', nextDay: '[Għada fil-]LT', nextWeek: 'dddd [fil-]LT', lastDay: '[Il-bieraħ fil-]LT', lastWeek: 'dddd [li għadda] [fil-]LT', sameElse: 'L' },
            relativeTime: { future: 'f’ %s', past: '%s ilu', s: 'ftit sekondi', ss: '%d sekondi', m: 'minuta', mm: '%d minuti', h: 'siegħa', hh: '%d siegħat', d: 'ġurnata', dd: '%d ġranet', M: 'xahar', MM: '%d xhur', y: 'sena', yy: '%d sni' },
            dayOfMonthOrdinalParse: /\d{1,2}\xba/,
            ordinal: '%dº',
            week: { dow: 1, doy: 4 },
          });
        var Qn = { 1: '၁', 2: '၂', 3: '၃', 4: '၄', 5: '၅', 6: '၆', 7: '၇', 8: '၈', 9: '၉', 0: '၀' },
          Xn = { '၁': '1', '၂': '2', '၃': '3', '၄': '4', '၅': '5', '၆': '6', '၇': '7', '၈': '8', '၉': '9', '၀': '0' };
        t.defineLocale('my', {
          months: 'ဇန်နဝါရီ_ဖေဖော်ဝါရီ_မတ်_ဧပြီ_မေ_ဇွန်_ဇူလိုင်_သြဂုတ်_စက်တင်ဘာ_အောက်တိုဘာ_နိုဝင်ဘာ_ဒီဇင်ဘာ'.split('_'),
          monthsShort: 'ဇန်_ဖေ_မတ်_ပြီ_မေ_ဇွန်_လိုင်_သြ_စက်_အောက်_နို_ဒီ'.split('_'),
          weekdays: 'တနင်္ဂနွေ_တနင်္လာ_အင်္ဂါ_ဗုဒ္ဓဟူး_ကြာသပတေး_သောကြာ_စနေ'.split('_'),
          weekdaysShort: 'နွေ_လာ_ဂါ_ဟူး_ကြာ_သော_နေ'.split('_'),
          weekdaysMin: 'နွေ_လာ_ဂါ_ဟူး_ကြာ_သော_နေ'.split('_'),
          longDateFormat: { LT: 'HH:mm', LTS: 'HH:mm:ss', L: 'DD/MM/YYYY', LL: 'D MMMM YYYY', LLL: 'D MMMM YYYY HH:mm', LLLL: 'dddd D MMMM YYYY HH:mm' },
          calendar: { sameDay: '[ယနေ.] LT [မှာ]', nextDay: '[မနက်ဖြန်] LT [မှာ]', nextWeek: 'dddd LT [မှာ]', lastDay: '[မနေ.က] LT [မှာ]', lastWeek: '[ပြီးခဲ့သော] dddd LT [မှာ]', sameElse: 'L' },
          relativeTime: { future: 'လာမည့် %s မှာ', past: 'လွန်ခဲ့သော %s က', s: 'စက္ကန်.အနည်းငယ်', ss: '%d စက္ကန့်', m: 'တစ်မိနစ်', mm: '%d မိနစ်', h: 'တစ်နာရီ', hh: '%d နာရီ', d: 'တစ်ရက်', dd: '%d ရက်', M: 'တစ်လ', MM: '%d လ', y: 'တစ်နှစ်', yy: '%d နှစ်' },
          preparse: function (e) {
            return e.replace(/[\u1041\u1042\u1043\u1044\u1045\u1046\u1047\u1048\u1049\u1040]/g, function (e) {
              return Xn[e];
            });
          },
          postformat: function (e) {
            return e.replace(/\d/g, function (e) {
              return Qn[e];
            });
          },
          week: { dow: 1, doy: 4 },
        }),
          t.defineLocale('nb', {
            months: 'januar_februar_mars_april_mai_juni_juli_august_september_oktober_november_desember'.split('_'),
            monthsShort: 'jan._feb._mars_apr._mai_juni_juli_aug._sep._okt._nov._des.'.split('_'),
            monthsParseExact: !0,
            weekdays: 'søndag_mandag_tirsdag_onsdag_torsdag_fredag_lørdag'.split('_'),
            weekdaysShort: 'sø._ma._ti._on._to._fr._lø.'.split('_'),
            weekdaysMin: 'sø_ma_ti_on_to_fr_lø'.split('_'),
            weekdaysParseExact: !0,
            longDateFormat: { LT: 'HH:mm', LTS: 'HH:mm:ss', L: 'DD.MM.YYYY', LL: 'D. MMMM YYYY', LLL: 'D. MMMM YYYY [kl.] HH:mm', LLLL: 'dddd D. MMMM YYYY [kl.] HH:mm' },
            calendar: { sameDay: '[i dag kl.] LT', nextDay: '[i morgen kl.] LT', nextWeek: 'dddd [kl.] LT', lastDay: '[i går kl.] LT', lastWeek: '[forrige] dddd [kl.] LT', sameElse: 'L' },
            relativeTime: { future: 'om %s', past: '%s siden', s: 'noen sekunder', ss: '%d sekunder', m: 'ett minutt', mm: '%d minutter', h: 'en time', hh: '%d timer', d: 'en dag', dd: '%d dager', w: 'en uke', ww: '%d uker', M: 'en måned', MM: '%d måneder', y: 'ett år', yy: '%d år' },
            dayOfMonthOrdinalParse: /\d{1,2}\./,
            ordinal: '%d.',
            week: { dow: 1, doy: 4 },
          });
        var ed = { 1: '१', 2: '२', 3: '३', 4: '४', 5: '५', 6: '६', 7: '७', 8: '८', 9: '९', 0: '०' },
          ad = { '१': '1', '२': '2', '३': '3', '४': '4', '५': '5', '६': '6', '७': '7', '८': '8', '९': '9', '०': '0' };
        t.defineLocale('ne', {
          months: 'जनवरी_फेब्रुवरी_मार्च_अप्रिल_मई_जुन_जुलाई_अगष्ट_सेप्टेम्बर_अक्टोबर_नोभेम्बर_डिसेम्बर'.split('_'),
          monthsShort: 'जन._फेब्रु._मार्च_अप्रि._मई_जुन_जुलाई._अग._सेप्ट._अक्टो._नोभे._डिसे.'.split('_'),
          monthsParseExact: !0,
          weekdays: 'आइतबार_सोमबार_मङ्गलबार_बुधबार_बिहिबार_शुक्रबार_शनिबार'.split('_'),
          weekdaysShort: 'आइत._सोम._मङ्गल._बुध._बिहि._शुक्र._शनि.'.split('_'),
          weekdaysMin: 'आ._सो._मं._बु._बि._शु._श.'.split('_'),
          weekdaysParseExact: !0,
          longDateFormat: { LT: 'Aको h:mm बजे', LTS: 'Aको h:mm:ss बजे', L: 'DD/MM/YYYY', LL: 'D MMMM YYYY', LLL: 'D MMMM YYYY, Aको h:mm बजे', LLLL: 'dddd, D MMMM YYYY, Aको h:mm बजे' },
          preparse: function (e) {
            return e.replace(/[\u0967\u0968\u0969\u096a\u096b\u096c\u096d\u096e\u096f\u0966]/g, function (e) {
              return ad[e];
            });
          },
          postformat: function (e) {
            return e.replace(/\d/g, function (e) {
              return ed[e];
            });
          },
          meridiemParse: /\u0930\u093e\u0924\u093f|\u092c\u093f\u0939\u093e\u0928|\u0926\u093f\u0909\u0901\u0938\u094b|\u0938\u093e\u0901\u091d/,
          meridiemHour: function (e, a) {
            return 12 === e && (e = 0), 'राति' === a ? (e < 4 ? e : e + 12) : 'बिहान' === a ? e : 'दिउँसो' === a ? (10 <= e ? e : e + 12) : 'साँझ' === a ? e + 12 : void 0;
          },
          meridiem: function (e, a, t) {
            return e < 3 ? 'राति' : e < 12 ? 'बिहान' : e < 16 ? 'दिउँसो' : e < 20 ? 'साँझ' : 'राति';
          },
          calendar: { sameDay: '[आज] LT', nextDay: '[भोलि] LT', nextWeek: '[आउँदो] dddd[,] LT', lastDay: '[हिजो] LT', lastWeek: '[गएको] dddd[,] LT', sameElse: 'L' },
          relativeTime: { future: '%sमा', past: '%s अगाडि', s: 'केही क्षण', ss: '%d सेकेण्ड', m: 'एक मिनेट', mm: '%d मिनेट', h: 'एक घण्टा', hh: '%d घण्टा', d: 'एक दिन', dd: '%d दिन', M: 'एक महिना', MM: '%d महिना', y: 'एक बर्ष', yy: '%d बर्ष' },
          week: { dow: 0, doy: 6 },
        });
        var td = 'jan._feb._mrt._apr._mei_jun._jul._aug._sep._okt._nov._dec.'.split('_'),
          sd = 'jan_feb_mrt_apr_mei_jun_jul_aug_sep_okt_nov_dec'.split('_'),
          nd = [/^jan/i, /^feb/i, /^maart|mrt.?$/i, /^apr/i, /^mei$/i, /^jun[i.]?$/i, /^jul[i.]?$/i, /^aug/i, /^sep/i, /^okt/i, /^nov/i, /^dec/i],
          dd = /^(januari|februari|maart|april|mei|ju[nl]i|augustus|september|oktober|november|december|jan\.?|feb\.?|mrt\.?|apr\.?|ju[nl]\.?|aug\.?|sep\.?|okt\.?|nov\.?|dec\.?)/i;
        t.defineLocale('nl-be', {
          months: 'januari_februari_maart_april_mei_juni_juli_augustus_september_oktober_november_december'.split('_'),
          monthsShort: function (e, a) {
            return e ? (/-MMM-/.test(a) ? sd[e.month()] : td[e.month()]) : td;
          },
          monthsRegex: dd,
          monthsShortRegex: dd,
          monthsStrictRegex: /^(januari|februari|maart|april|mei|ju[nl]i|augustus|september|oktober|november|december)/i,
          monthsShortStrictRegex: /^(jan\.?|feb\.?|mrt\.?|apr\.?|mei|ju[nl]\.?|aug\.?|sep\.?|okt\.?|nov\.?|dec\.?)/i,
          monthsParse: nd,
          longMonthsParse: nd,
          shortMonthsParse: nd,
          weekdays: 'zondag_maandag_dinsdag_woensdag_donderdag_vrijdag_zaterdag'.split('_'),
          weekdaysShort: 'zo._ma._di._wo._do._vr._za.'.split('_'),
          weekdaysMin: 'zo_ma_di_wo_do_vr_za'.split('_'),
          weekdaysParseExact: !0,
          longDateFormat: { LT: 'HH:mm', LTS: 'HH:mm:ss', L: 'DD/MM/YYYY', LL: 'D MMMM YYYY', LLL: 'D MMMM YYYY HH:mm', LLLL: 'dddd D MMMM YYYY HH:mm' },
          calendar: { sameDay: '[vandaag om] LT', nextDay: '[morgen om] LT', nextWeek: 'dddd [om] LT', lastDay: '[gisteren om] LT', lastWeek: '[afgelopen] dddd [om] LT', sameElse: 'L' },
          relativeTime: { future: 'over %s', past: '%s geleden', s: 'een paar seconden', ss: '%d seconden', m: 'één minuut', mm: '%d minuten', h: 'één uur', hh: '%d uur', d: 'één dag', dd: '%d dagen', M: 'één maand', MM: '%d maanden', y: 'één jaar', yy: '%d jaar' },
          dayOfMonthOrdinalParse: /\d{1,2}(ste|de)/,
          ordinal: function (e) {
            return e + (1 === e || 8 === e || 20 <= e ? 'ste' : 'de');
          },
          week: { dow: 1, doy: 4 },
        });
        var rd = 'jan._feb._mrt._apr._mei_jun._jul._aug._sep._okt._nov._dec.'.split('_'),
          id = 'jan_feb_mrt_apr_mei_jun_jul_aug_sep_okt_nov_dec'.split('_'),
          ud = [/^jan/i, /^feb/i, /^maart|mrt.?$/i, /^apr/i, /^mei$/i, /^jun[i.]?$/i, /^jul[i.]?$/i, /^aug/i, /^sep/i, /^okt/i, /^nov/i, /^dec/i],
          _d = /^(januari|februari|maart|april|mei|ju[nl]i|augustus|september|oktober|november|december|jan\.?|feb\.?|mrt\.?|apr\.?|ju[nl]\.?|aug\.?|sep\.?|okt\.?|nov\.?|dec\.?)/i;
        t.defineLocale('nl', {
          months: 'januari_februari_maart_april_mei_juni_juli_augustus_september_oktober_november_december'.split('_'),
          monthsShort: function (e, a) {
            return e ? (/-MMM-/.test(a) ? id[e.month()] : rd[e.month()]) : rd;
          },
          monthsRegex: _d,
          monthsShortRegex: _d,
          monthsStrictRegex: /^(januari|februari|maart|april|mei|ju[nl]i|augustus|september|oktober|november|december)/i,
          monthsShortStrictRegex: /^(jan\.?|feb\.?|mrt\.?|apr\.?|mei|ju[nl]\.?|aug\.?|sep\.?|okt\.?|nov\.?|dec\.?)/i,
          monthsParse: ud,
          longMonthsParse: ud,
          shortMonthsParse: ud,
          weekdays: 'zondag_maandag_dinsdag_woensdag_donderdag_vrijdag_zaterdag'.split('_'),
          weekdaysShort: 'zo._ma._di._wo._do._vr._za.'.split('_'),
          weekdaysMin: 'zo_ma_di_wo_do_vr_za'.split('_'),
          weekdaysParseExact: !0,
          longDateFormat: { LT: 'HH:mm', LTS: 'HH:mm:ss', L: 'DD-MM-YYYY', LL: 'D MMMM YYYY', LLL: 'D MMMM YYYY HH:mm', LLLL: 'dddd D MMMM YYYY HH:mm' },
          calendar: { sameDay: '[vandaag om] LT', nextDay: '[morgen om] LT', nextWeek: 'dddd [om] LT', lastDay: '[gisteren om] LT', lastWeek: '[afgelopen] dddd [om] LT', sameElse: 'L' },
          relativeTime: { future: 'over %s', past: '%s geleden', s: 'een paar seconden', ss: '%d seconden', m: 'één minuut', mm: '%d minuten', h: 'één uur', hh: '%d uur', d: 'één dag', dd: '%d dagen', w: 'één week', ww: '%d weken', M: 'één maand', MM: '%d maanden', y: 'één jaar', yy: '%d jaar' },
          dayOfMonthOrdinalParse: /\d{1,2}(ste|de)/,
          ordinal: function (e) {
            return e + (1 === e || 8 === e || 20 <= e ? 'ste' : 'de');
          },
          week: { dow: 1, doy: 4 },
        }),
          t.defineLocale('nn', {
            months: 'januar_februar_mars_april_mai_juni_juli_august_september_oktober_november_desember'.split('_'),
            monthsShort: 'jan._feb._mars_apr._mai_juni_juli_aug._sep._okt._nov._des.'.split('_'),
            monthsParseExact: !0,
            weekdays: 'sundag_måndag_tysdag_onsdag_torsdag_fredag_laurdag'.split('_'),
            weekdaysShort: 'su._må._ty._on._to._fr._lau.'.split('_'),
            weekdaysMin: 'su_må_ty_on_to_fr_la'.split('_'),
            weekdaysParseExact: !0,
            longDateFormat: { LT: 'HH:mm', LTS: 'HH:mm:ss', L: 'DD.MM.YYYY', LL: 'D. MMMM YYYY', LLL: 'D. MMMM YYYY [kl.] H:mm', LLLL: 'dddd D. MMMM YYYY [kl.] HH:mm' },
            calendar: { sameDay: '[I dag klokka] LT', nextDay: '[I morgon klokka] LT', nextWeek: 'dddd [klokka] LT', lastDay: '[I går klokka] LT', lastWeek: '[Føregåande] dddd [klokka] LT', sameElse: 'L' },
            relativeTime: { future: 'om %s', past: '%s sidan', s: 'nokre sekund', ss: '%d sekund', m: 'eit minutt', mm: '%d minutt', h: 'ein time', hh: '%d timar', d: 'ein dag', dd: '%d dagar', w: 'ei veke', ww: '%d veker', M: 'ein månad', MM: '%d månader', y: 'eit år', yy: '%d år' },
            dayOfMonthOrdinalParse: /\d{1,2}\./,
            ordinal: '%d.',
            week: { dow: 1, doy: 4 },
          }),
          t.defineLocale('oc-lnc', {
            months: { standalone: 'genièr_febrièr_març_abril_mai_junh_julhet_agost_setembre_octòbre_novembre_decembre'.split('_'), format: "de genièr_de febrièr_de març_d'abril_de mai_de junh_de julhet_d'agost_de setembre_d'octòbre_de novembre_de decembre".split('_'), isFormat: /D[oD]?(\s)+MMMM/ },
            monthsShort: 'gen._febr._març_abr._mai_junh_julh._ago._set._oct._nov._dec.'.split('_'),
            monthsParseExact: !0,
            weekdays: 'dimenge_diluns_dimars_dimècres_dijòus_divendres_dissabte'.split('_'),
            weekdaysShort: 'dg._dl._dm._dc._dj._dv._ds.'.split('_'),
            weekdaysMin: 'dg_dl_dm_dc_dj_dv_ds'.split('_'),
            weekdaysParseExact: !0,
            longDateFormat: { LT: 'H:mm', LTS: 'H:mm:ss', L: 'DD/MM/YYYY', LL: 'D MMMM [de] YYYY', ll: 'D MMM YYYY', LLL: 'D MMMM [de] YYYY [a] H:mm', lll: 'D MMM YYYY, H:mm', LLLL: 'dddd D MMMM [de] YYYY [a] H:mm', llll: 'ddd D MMM YYYY, H:mm' },
            calendar: { sameDay: '[uèi a] LT', nextDay: '[deman a] LT', nextWeek: 'dddd [a] LT', lastDay: '[ièr a] LT', lastWeek: 'dddd [passat a] LT', sameElse: 'L' },
            relativeTime: { future: "d'aquí %s", past: 'fa %s', s: 'unas segondas', ss: '%d segondas', m: 'una minuta', mm: '%d minutas', h: 'una ora', hh: '%d oras', d: 'un jorn', dd: '%d jorns', M: 'un mes', MM: '%d meses', y: 'un an', yy: '%d ans' },
            dayOfMonthOrdinalParse: /\d{1,2}(r|n|t|\xe8|a)/,
            ordinal: function (e, a) {
              return e + ('w' !== a && 'W' !== a ? (1 === e ? 'r' : 2 === e ? 'n' : 3 === e ? 'r' : 4 === e ? 't' : 'è') : 'a');
            },
            week: { dow: 1, doy: 4 },
          });
        var od = { 1: '੧', 2: '੨', 3: '੩', 4: '੪', 5: '੫', 6: '੬', 7: '੭', 8: '੮', 9: '੯', 0: '੦' },
          md = { '੧': '1', '੨': '2', '੩': '3', '੪': '4', '੫': '5', '੬': '6', '੭': '7', '੮': '8', '੯': '9', '੦': '0' };
        t.defineLocale('pa-in', {
          months: 'ਜਨਵਰੀ_ਫ਼ਰਵਰੀ_ਮਾਰਚ_ਅਪ੍ਰੈਲ_ਮਈ_ਜੂਨ_ਜੁਲਾਈ_ਅਗਸਤ_ਸਤੰਬਰ_ਅਕਤੂਬਰ_ਨਵੰਬਰ_ਦਸੰਬਰ'.split('_'),
          monthsShort: 'ਜਨਵਰੀ_ਫ਼ਰਵਰੀ_ਮਾਰਚ_ਅਪ੍ਰੈਲ_ਮਈ_ਜੂਨ_ਜੁਲਾਈ_ਅਗਸਤ_ਸਤੰਬਰ_ਅਕਤੂਬਰ_ਨਵੰਬਰ_ਦਸੰਬਰ'.split('_'),
          weekdays: 'ਐਤਵਾਰ_ਸੋਮਵਾਰ_ਮੰਗਲਵਾਰ_ਬੁਧਵਾਰ_ਵੀਰਵਾਰ_ਸ਼ੁੱਕਰਵਾਰ_ਸ਼ਨੀਚਰਵਾਰ'.split('_'),
          weekdaysShort: 'ਐਤ_ਸੋਮ_ਮੰਗਲ_ਬੁਧ_ਵੀਰ_ਸ਼ੁਕਰ_ਸ਼ਨੀ'.split('_'),
          weekdaysMin: 'ਐਤ_ਸੋਮ_ਮੰਗਲ_ਬੁਧ_ਵੀਰ_ਸ਼ੁਕਰ_ਸ਼ਨੀ'.split('_'),
          longDateFormat: { LT: 'A h:mm ਵਜੇ', LTS: 'A h:mm:ss ਵਜੇ', L: 'DD/MM/YYYY', LL: 'D MMMM YYYY', LLL: 'D MMMM YYYY, A h:mm ਵਜੇ', LLLL: 'dddd, D MMMM YYYY, A h:mm ਵਜੇ' },
          calendar: { sameDay: '[ਅਜ] LT', nextDay: '[ਕਲ] LT', nextWeek: '[ਅਗਲਾ] dddd, LT', lastDay: '[ਕਲ] LT', lastWeek: '[ਪਿਛਲੇ] dddd, LT', sameElse: 'L' },
          relativeTime: { future: '%s ਵਿੱਚ', past: '%s ਪਿਛਲੇ', s: 'ਕੁਝ ਸਕਿੰਟ', ss: '%d ਸਕਿੰਟ', m: 'ਇਕ ਮਿੰਟ', mm: '%d ਮਿੰਟ', h: 'ਇੱਕ ਘੰਟਾ', hh: '%d ਘੰਟੇ', d: 'ਇੱਕ ਦਿਨ', dd: '%d ਦਿਨ', M: 'ਇੱਕ ਮਹੀਨਾ', MM: '%d ਮਹੀਨੇ', y: 'ਇੱਕ ਸਾਲ', yy: '%d ਸਾਲ' },
          preparse: function (e) {
            return e.replace(/[\u0a67\u0a68\u0a69\u0a6a\u0a6b\u0a6c\u0a6d\u0a6e\u0a6f\u0a66]/g, function (e) {
              return md[e];
            });
          },
          postformat: function (e) {
            return e.replace(/\d/g, function (e) {
              return od[e];
            });
          },
          meridiemParse: /\u0a30\u0a3e\u0a24|\u0a38\u0a35\u0a47\u0a30|\u0a26\u0a41\u0a2a\u0a39\u0a3f\u0a30|\u0a38\u0a3c\u0a3e\u0a2e/,
          meridiemHour: function (e, a) {
            return 12 === e && (e = 0), 'ਰਾਤ' === a ? (e < 4 ? e : e + 12) : 'ਸਵੇਰ' === a ? e : 'ਦੁਪਹਿਰ' === a ? (10 <= e ? e : e + 12) : 'ਸ਼ਾਮ' === a ? e + 12 : void 0;
          },
          meridiem: function (e, a, t) {
            return e < 4 ? 'ਰਾਤ' : e < 10 ? 'ਸਵੇਰ' : e < 17 ? 'ਦੁਪਹਿਰ' : e < 20 ? 'ਸ਼ਾਮ' : 'ਰਾਤ';
          },
          week: { dow: 0, doy: 6 },
        });
        var ld = 'styczeń_luty_marzec_kwiecień_maj_czerwiec_lipiec_sierpień_wrzesień_październik_listopad_grudzień'.split('_'),
          Md = 'stycznia_lutego_marca_kwietnia_maja_czerwca_lipca_sierpnia_września_października_listopada_grudnia'.split('_'),
          hd = [/^sty/i, /^lut/i, /^mar/i, /^kwi/i, /^maj/i, /^cze/i, /^lip/i, /^sie/i, /^wrz/i, /^pa\u017a/i, /^lis/i, /^gru/i];
        function cd(e) {
          return e % 10 < 5 && 1 < e % 10 && ~~(e / 10) % 10 != 1;
        }
        function Ld(e, a, t) {
          var s = e + ' ';
          switch (t) {
            case 'ss':
              return s + (cd(e) ? 'sekundy' : 'sekund');
            case 'm':
              return a ? 'minuta' : 'minutę';
            case 'mm':
              return s + (cd(e) ? 'minuty' : 'minut');
            case 'h':
              return a ? 'godzina' : 'godzinę';
            case 'hh':
              return s + (cd(e) ? 'godziny' : 'godzin');
            case 'ww':
              return s + (cd(e) ? 'tygodnie' : 'tygodni');
            case 'MM':
              return s + (cd(e) ? 'miesiące' : 'miesięcy');
            case 'yy':
              return s + (cd(e) ? 'lata' : 'lat');
          }
        }
        function Yd(e, a, t) {
          return e + (20 <= e % 100 || (100 <= e && e % 100 == 0) ? ' de ' : ' ') + { ss: 'secunde', mm: 'minute', hh: 'ore', dd: 'zile', ww: 'săptămâni', MM: 'luni', yy: 'ani' }[t];
        }
        function yd(e, a, t) {
          var s, n;
          return 'm' === t
            ? a
              ? 'минута'
              : 'минуту'
            : e +
                ' ' +
                ((s = +e),
                (n = { ss: a ? 'секунда_секунды_секунд' : 'секунду_секунды_секунд', mm: a ? 'минута_минуты_минут' : 'минуту_минуты_минут', hh: 'час_часа_часов', dd: 'день_дня_дней', ww: 'неделя_недели_недель', MM: 'месяц_месяца_месяцев', yy: 'год_года_лет' }[t].split('_')),
                s % 10 == 1 && s % 100 != 11 ? n[0] : 2 <= s % 10 && s % 10 <= 4 && (s % 100 < 10 || 20 <= s % 100) ? n[1] : n[2]);
        }
        t.defineLocale('pl', {
          months: function (e, a) {
            return e ? (/D MMMM/.test(a) ? Md[e.month()] : ld[e.month()]) : ld;
          },
          monthsShort: 'sty_lut_mar_kwi_maj_cze_lip_sie_wrz_paź_lis_gru'.split('_'),
          monthsParse: hd,
          longMonthsParse: hd,
          shortMonthsParse: hd,
          weekdays: 'niedziela_poniedziałek_wtorek_środa_czwartek_piątek_sobota'.split('_'),
          weekdaysShort: 'ndz_pon_wt_śr_czw_pt_sob'.split('_'),
          weekdaysMin: 'Nd_Pn_Wt_Śr_Cz_Pt_So'.split('_'),
          longDateFormat: { LT: 'HH:mm', LTS: 'HH:mm:ss', L: 'DD.MM.YYYY', LL: 'D MMMM YYYY', LLL: 'D MMMM YYYY HH:mm', LLLL: 'dddd, D MMMM YYYY HH:mm' },
          calendar: {
            sameDay: '[Dziś o] LT',
            nextDay: '[Jutro o] LT',
            nextWeek: function () {
              switch (this.day()) {
                case 0:
                  return '[W niedzielę o] LT';
                case 2:
                  return '[We wtorek o] LT';
                case 3:
                  return '[W środę o] LT';
                case 6:
                  return '[W sobotę o] LT';
                default:
                  return '[W] dddd [o] LT';
              }
            },
            lastDay: '[Wczoraj o] LT',
            lastWeek: function () {
              switch (this.day()) {
                case 0:
                  return '[W zeszłą niedzielę o] LT';
                case 3:
                  return '[W zeszłą środę o] LT';
                case 6:
                  return '[W zeszłą sobotę o] LT';
                default:
                  return '[W zeszły] dddd [o] LT';
              }
            },
            sameElse: 'L',
          },
          relativeTime: { future: 'za %s', past: '%s temu', s: 'kilka sekund', ss: Ld, m: Ld, mm: Ld, h: Ld, hh: Ld, d: '1 dzień', dd: '%d dni', w: 'tydzień', ww: Ld, M: 'miesiąc', MM: Ld, y: 'rok', yy: Ld },
          dayOfMonthOrdinalParse: /\d{1,2}\./,
          ordinal: '%d.',
          week: { dow: 1, doy: 4 },
        }),
          t.defineLocale('pt-br', {
            months: 'janeiro_fevereiro_março_abril_maio_junho_julho_agosto_setembro_outubro_novembro_dezembro'.split('_'),
            monthsShort: 'jan_fev_mar_abr_mai_jun_jul_ago_set_out_nov_dez'.split('_'),
            weekdays: 'domingo_segunda-feira_terça-feira_quarta-feira_quinta-feira_sexta-feira_sábado'.split('_'),
            weekdaysShort: 'dom_seg_ter_qua_qui_sex_sáb'.split('_'),
            weekdaysMin: 'do_2ª_3ª_4ª_5ª_6ª_sá'.split('_'),
            weekdaysParseExact: !0,
            longDateFormat: { LT: 'HH:mm', LTS: 'HH:mm:ss', L: 'DD/MM/YYYY', LL: 'D [de] MMMM [de] YYYY', LLL: 'D [de] MMMM [de] YYYY [às] HH:mm', LLLL: 'dddd, D [de] MMMM [de] YYYY [às] HH:mm' },
            calendar: {
              sameDay: '[Hoje às] LT',
              nextDay: '[Amanhã às] LT',
              nextWeek: 'dddd [às] LT',
              lastDay: '[Ontem às] LT',
              lastWeek: function () {
                return 0 === this.day() || 6 === this.day() ? '[Último] dddd [às] LT' : '[Última] dddd [às] LT';
              },
              sameElse: 'L',
            },
            relativeTime: { future: 'em %s', past: 'há %s', s: 'poucos segundos', ss: '%d segundos', m: 'um minuto', mm: '%d minutos', h: 'uma hora', hh: '%d horas', d: 'um dia', dd: '%d dias', M: 'um mês', MM: '%d meses', y: 'um ano', yy: '%d anos' },
            dayOfMonthOrdinalParse: /\d{1,2}\xba/,
            ordinal: '%dº',
            invalidDate: 'Data inválida',
          }),
          t.defineLocale('pt', {
            months: 'janeiro_fevereiro_março_abril_maio_junho_julho_agosto_setembro_outubro_novembro_dezembro'.split('_'),
            monthsShort: 'jan_fev_mar_abr_mai_jun_jul_ago_set_out_nov_dez'.split('_'),
            weekdays: 'Domingo_Segunda-feira_Terça-feira_Quarta-feira_Quinta-feira_Sexta-feira_Sábado'.split('_'),
            weekdaysShort: 'Dom_Seg_Ter_Qua_Qui_Sex_Sáb'.split('_'),
            weekdaysMin: 'Do_2ª_3ª_4ª_5ª_6ª_Sá'.split('_'),
            weekdaysParseExact: !0,
            longDateFormat: { LT: 'HH:mm', LTS: 'HH:mm:ss', L: 'DD/MM/YYYY', LL: 'D [de] MMMM [de] YYYY', LLL: 'D [de] MMMM [de] YYYY HH:mm', LLLL: 'dddd, D [de] MMMM [de] YYYY HH:mm' },
            calendar: {
              sameDay: '[Hoje às] LT',
              nextDay: '[Amanhã às] LT',
              nextWeek: 'dddd [às] LT',
              lastDay: '[Ontem às] LT',
              lastWeek: function () {
                return 0 === this.day() || 6 === this.day() ? '[Último] dddd [às] LT' : '[Última] dddd [às] LT';
              },
              sameElse: 'L',
            },
            relativeTime: { future: 'em %s', past: 'há %s', s: 'segundos', ss: '%d segundos', m: 'um minuto', mm: '%d minutos', h: 'uma hora', hh: '%d horas', d: 'um dia', dd: '%d dias', w: 'uma semana', ww: '%d semanas', M: 'um mês', MM: '%d meses', y: 'um ano', yy: '%d anos' },
            dayOfMonthOrdinalParse: /\d{1,2}\xba/,
            ordinal: '%dº',
            week: { dow: 1, doy: 4 },
          }),
          t.defineLocale('ro', {
            months: 'ianuarie_februarie_martie_aprilie_mai_iunie_iulie_august_septembrie_octombrie_noiembrie_decembrie'.split('_'),
            monthsShort: 'ian._feb._mart._apr._mai_iun._iul._aug._sept._oct._nov._dec.'.split('_'),
            monthsParseExact: !0,
            weekdays: 'duminică_luni_marți_miercuri_joi_vineri_sâmbătă'.split('_'),
            weekdaysShort: 'Dum_Lun_Mar_Mie_Joi_Vin_Sâm'.split('_'),
            weekdaysMin: 'Du_Lu_Ma_Mi_Jo_Vi_Sâ'.split('_'),
            longDateFormat: { LT: 'H:mm', LTS: 'H:mm:ss', L: 'DD.MM.YYYY', LL: 'D MMMM YYYY', LLL: 'D MMMM YYYY H:mm', LLLL: 'dddd, D MMMM YYYY H:mm' },
            calendar: { sameDay: '[azi la] LT', nextDay: '[mâine la] LT', nextWeek: 'dddd [la] LT', lastDay: '[ieri la] LT', lastWeek: '[fosta] dddd [la] LT', sameElse: 'L' },
            relativeTime: { future: 'peste %s', past: '%s în urmă', s: 'câteva secunde', ss: Yd, m: 'un minut', mm: Yd, h: 'o oră', hh: Yd, d: 'o zi', dd: Yd, w: 'o săptămână', ww: Yd, M: 'o lună', MM: Yd, y: 'un an', yy: Yd },
            week: { dow: 1, doy: 7 },
          });
        var fd = [
          /^\u044f\u043d\u0432/i,
          /^\u0444\u0435\u0432/i,
          /^\u043c\u0430\u0440/i,
          /^\u0430\u043f\u0440/i,
          /^\u043c\u0430[\u0439\u044f]/i,
          /^\u0438\u044e\u043d/i,
          /^\u0438\u044e\u043b/i,
          /^\u0430\u0432\u0433/i,
          /^\u0441\u0435\u043d/i,
          /^\u043e\u043a\u0442/i,
          /^\u043d\u043e\u044f/i,
          /^\u0434\u0435\u043a/i,
        ];
        t.defineLocale('ru', {
          months: { format: 'января_февраля_марта_апреля_мая_июня_июля_августа_сентября_октября_ноября_декабря'.split('_'), standalone: 'январь_февраль_март_апрель_май_июнь_июль_август_сентябрь_октябрь_ноябрь_декабрь'.split('_') },
          monthsShort: { format: 'янв._февр._мар._апр._мая_июня_июля_авг._сент._окт._нояб._дек.'.split('_'), standalone: 'янв._февр._март_апр._май_июнь_июль_авг._сент._окт._нояб._дек.'.split('_') },
          weekdays: {
            standalone: 'воскресенье_понедельник_вторник_среда_четверг_пятница_суббота'.split('_'),
            format: 'воскресенье_понедельник_вторник_среду_четверг_пятницу_субботу'.split('_'),
            isFormat: /\[ ?[\u0412\u0432] ?(?:\u043f\u0440\u043e\u0448\u043b\u0443\u044e|\u0441\u043b\u0435\u0434\u0443\u044e\u0449\u0443\u044e|\u044d\u0442\u0443)? ?] ?dddd/,
          },
          weekdaysShort: 'вс_пн_вт_ср_чт_пт_сб'.split('_'),
          weekdaysMin: 'вс_пн_вт_ср_чт_пт_сб'.split('_'),
          monthsParse: fd,
          longMonthsParse: fd,
          shortMonthsParse: fd,
          monthsRegex:
            /^(\u044f\u043d\u0432\u0430\u0440[\u044c\u044f]|\u044f\u043d\u0432\.?|\u0444\u0435\u0432\u0440\u0430\u043b[\u044c\u044f]|\u0444\u0435\u0432\u0440?\.?|\u043c\u0430\u0440\u0442\u0430?|\u043c\u0430\u0440\.?|\u0430\u043f\u0440\u0435\u043b[\u044c\u044f]|\u0430\u043f\u0440\.?|\u043c\u0430[\u0439\u044f]|\u0438\u044e\u043d[\u044c\u044f]|\u0438\u044e\u043d\.?|\u0438\u044e\u043b[\u044c\u044f]|\u0438\u044e\u043b\.?|\u0430\u0432\u0433\u0443\u0441\u0442\u0430?|\u0430\u0432\u0433\.?|\u0441\u0435\u043d\u0442\u044f\u0431\u0440[\u044c\u044f]|\u0441\u0435\u043d\u0442?\.?|\u043e\u043a\u0442\u044f\u0431\u0440[\u044c\u044f]|\u043e\u043a\u0442\.?|\u043d\u043e\u044f\u0431\u0440[\u044c\u044f]|\u043d\u043e\u044f\u0431?\.?|\u0434\u0435\u043a\u0430\u0431\u0440[\u044c\u044f]|\u0434\u0435\u043a\.?)/i,
          monthsShortRegex:
            /^(\u044f\u043d\u0432\u0430\u0440[\u044c\u044f]|\u044f\u043d\u0432\.?|\u0444\u0435\u0432\u0440\u0430\u043b[\u044c\u044f]|\u0444\u0435\u0432\u0440?\.?|\u043c\u0430\u0440\u0442\u0430?|\u043c\u0430\u0440\.?|\u0430\u043f\u0440\u0435\u043b[\u044c\u044f]|\u0430\u043f\u0440\.?|\u043c\u0430[\u0439\u044f]|\u0438\u044e\u043d[\u044c\u044f]|\u0438\u044e\u043d\.?|\u0438\u044e\u043b[\u044c\u044f]|\u0438\u044e\u043b\.?|\u0430\u0432\u0433\u0443\u0441\u0442\u0430?|\u0430\u0432\u0433\.?|\u0441\u0435\u043d\u0442\u044f\u0431\u0440[\u044c\u044f]|\u0441\u0435\u043d\u0442?\.?|\u043e\u043a\u0442\u044f\u0431\u0440[\u044c\u044f]|\u043e\u043a\u0442\.?|\u043d\u043e\u044f\u0431\u0440[\u044c\u044f]|\u043d\u043e\u044f\u0431?\.?|\u0434\u0435\u043a\u0430\u0431\u0440[\u044c\u044f]|\u0434\u0435\u043a\.?)/i,
          monthsStrictRegex:
            /^(\u044f\u043d\u0432\u0430\u0440[\u044f\u044c]|\u0444\u0435\u0432\u0440\u0430\u043b[\u044f\u044c]|\u043c\u0430\u0440\u0442\u0430?|\u0430\u043f\u0440\u0435\u043b[\u044f\u044c]|\u043c\u0430[\u044f\u0439]|\u0438\u044e\u043d[\u044f\u044c]|\u0438\u044e\u043b[\u044f\u044c]|\u0430\u0432\u0433\u0443\u0441\u0442\u0430?|\u0441\u0435\u043d\u0442\u044f\u0431\u0440[\u044f\u044c]|\u043e\u043a\u0442\u044f\u0431\u0440[\u044f\u044c]|\u043d\u043e\u044f\u0431\u0440[\u044f\u044c]|\u0434\u0435\u043a\u0430\u0431\u0440[\u044f\u044c])/i,
          monthsShortStrictRegex:
            /^(\u044f\u043d\u0432\.|\u0444\u0435\u0432\u0440?\.|\u043c\u0430\u0440[\u0442.]|\u0430\u043f\u0440\.|\u043c\u0430[\u044f\u0439]|\u0438\u044e\u043d[\u044c\u044f.]|\u0438\u044e\u043b[\u044c\u044f.]|\u0430\u0432\u0433\.|\u0441\u0435\u043d\u0442?\.|\u043e\u043a\u0442\.|\u043d\u043e\u044f\u0431?\.|\u0434\u0435\u043a\.)/i,
          longDateFormat: { LT: 'H:mm', LTS: 'H:mm:ss', L: 'DD.MM.YYYY', LL: 'D MMMM YYYY г.', LLL: 'D MMMM YYYY г., H:mm', LLLL: 'dddd, D MMMM YYYY г., H:mm' },
          calendar: {
            sameDay: '[Сегодня, в] LT',
            nextDay: '[Завтра, в] LT',
            lastDay: '[Вчера, в] LT',
            nextWeek: function (e) {
              if (e.week() === this.week()) return 2 === this.day() ? '[Во] dddd, [в] LT' : '[В] dddd, [в] LT';
              switch (this.day()) {
                case 0:
                  return '[В следующее] dddd, [в] LT';
                case 1:
                case 2:
                case 4:
                  return '[В следующий] dddd, [в] LT';
                case 3:
                case 5:
                case 6:
                  return '[В следующую] dddd, [в] LT';
              }
            },
            lastWeek: function (e) {
              if (e.week() === this.week()) return 2 === this.day() ? '[Во] dddd, [в] LT' : '[В] dddd, [в] LT';
              switch (this.day()) {
                case 0:
                  return '[В прошлое] dddd, [в] LT';
                case 1:
                case 2:
                case 4:
                  return '[В прошлый] dddd, [в] LT';
                case 3:
                case 5:
                case 6:
                  return '[В прошлую] dddd, [в] LT';
              }
            },
            sameElse: 'L',
          },
          relativeTime: { future: 'через %s', past: '%s назад', s: 'несколько секунд', ss: yd, m: yd, mm: yd, h: 'час', hh: yd, d: 'день', dd: yd, w: 'неделя', ww: yd, M: 'месяц', MM: yd, y: 'год', yy: yd },
          meridiemParse: /\u043d\u043e\u0447\u0438|\u0443\u0442\u0440\u0430|\u0434\u043d\u044f|\u0432\u0435\u0447\u0435\u0440\u0430/i,
          isPM: function (e) {
            return /^(\u0434\u043d\u044f|\u0432\u0435\u0447\u0435\u0440\u0430)$/.test(e);
          },
          meridiem: function (e, a, t) {
            return e < 4 ? 'ночи' : e < 12 ? 'утра' : e < 17 ? 'дня' : 'вечера';
          },
          dayOfMonthOrdinalParse: /\d{1,2}-(\u0439|\u0433\u043e|\u044f)/,
          ordinal: function (e, a) {
            switch (a) {
              case 'M':
              case 'd':
              case 'DDD':
                return e + '-й';
              case 'D':
                return e + '-го';
              case 'w':
              case 'W':
                return e + '-я';
              default:
                return e;
            }
          },
          week: { dow: 1, doy: 4 },
        });
        var pd = ['جنوري', 'فيبروري', 'مارچ', 'اپريل', 'مئي', 'جون', 'جولاءِ', 'آگسٽ', 'سيپٽمبر', 'آڪٽوبر', 'نومبر', 'ڊسمبر'],
          kd = ['آچر', 'سومر', 'اڱارو', 'اربع', 'خميس', 'جمع', 'ڇنڇر'];
        t.defineLocale('sd', {
          months: pd,
          monthsShort: pd,
          weekdays: kd,
          weekdaysShort: kd,
          weekdaysMin: kd,
          longDateFormat: { LT: 'HH:mm', LTS: 'HH:mm:ss', L: 'DD/MM/YYYY', LL: 'D MMMM YYYY', LLL: 'D MMMM YYYY HH:mm', LLLL: 'dddd، D MMMM YYYY HH:mm' },
          meridiemParse: /\u0635\u0628\u062d|\u0634\u0627\u0645/,
          isPM: function (e) {
            return 'شام' === e;
          },
          meridiem: function (e, a, t) {
            return e < 12 ? 'صبح' : 'شام';
          },
          calendar: { sameDay: '[اڄ] LT', nextDay: '[سڀاڻي] LT', nextWeek: 'dddd [اڳين هفتي تي] LT', lastDay: '[ڪالهه] LT', lastWeek: '[گزريل هفتي] dddd [تي] LT', sameElse: 'L' },
          relativeTime: { future: '%s پوء', past: '%s اڳ', s: 'چند سيڪنڊ', ss: '%d سيڪنڊ', m: 'هڪ منٽ', mm: '%d منٽ', h: 'هڪ ڪلاڪ', hh: '%d ڪلاڪ', d: 'هڪ ڏينهن', dd: '%d ڏينهن', M: 'هڪ مهينو', MM: '%d مهينا', y: 'هڪ سال', yy: '%d سال' },
          preparse: function (e) {
            return e.replace(/\u060c/g, ',');
          },
          postformat: function (e) {
            return e.replace(/,/g, '،');
          },
          week: { dow: 1, doy: 4 },
        }),
          t.defineLocale('se', {
            months: 'ođđajagemánnu_guovvamánnu_njukčamánnu_cuoŋománnu_miessemánnu_geassemánnu_suoidnemánnu_borgemánnu_čakčamánnu_golggotmánnu_skábmamánnu_juovlamánnu'.split('_'),
            monthsShort: 'ođđj_guov_njuk_cuo_mies_geas_suoi_borg_čakč_golg_skáb_juov'.split('_'),
            weekdays: 'sotnabeaivi_vuossárga_maŋŋebárga_gaskavahkku_duorastat_bearjadat_lávvardat'.split('_'),
            weekdaysShort: 'sotn_vuos_maŋ_gask_duor_bear_láv'.split('_'),
            weekdaysMin: 's_v_m_g_d_b_L'.split('_'),
            longDateFormat: { LT: 'HH:mm', LTS: 'HH:mm:ss', L: 'DD.MM.YYYY', LL: 'MMMM D. [b.] YYYY', LLL: 'MMMM D. [b.] YYYY [ti.] HH:mm', LLLL: 'dddd, MMMM D. [b.] YYYY [ti.] HH:mm' },
            calendar: { sameDay: '[otne ti] LT', nextDay: '[ihttin ti] LT', nextWeek: 'dddd [ti] LT', lastDay: '[ikte ti] LT', lastWeek: '[ovddit] dddd [ti] LT', sameElse: 'L' },
            relativeTime: { future: '%s geažes', past: 'maŋit %s', s: 'moadde sekunddat', ss: '%d sekunddat', m: 'okta minuhta', mm: '%d minuhtat', h: 'okta diimmu', hh: '%d diimmut', d: 'okta beaivi', dd: '%d beaivvit', M: 'okta mánnu', MM: '%d mánut', y: 'okta jahki', yy: '%d jagit' },
            dayOfMonthOrdinalParse: /\d{1,2}\./,
            ordinal: '%d.',
            week: { dow: 1, doy: 4 },
          }),
          t.defineLocale('si', {
            months: 'ජනවාරි_පෙබරවාරි_මාර්තු_අප්‍රේල්_මැයි_ජූනි_ජූලි_අගෝස්තු_සැප්තැම්බර්_ඔක්තෝබර්_නොවැම්බර්_දෙසැම්බර්'.split('_'),
            monthsShort: 'ජන_පෙබ_මාර්_අප්_මැයි_ජූනි_ජූලි_අගෝ_සැප්_ඔක්_නොවැ_දෙසැ'.split('_'),
            weekdays: 'ඉරිදා_සඳුදා_අඟහරුවාදා_බදාදා_බ්‍රහස්පතින්දා_සිකුරාදා_සෙනසුරාදා'.split('_'),
            weekdaysShort: 'ඉරි_සඳු_අඟ_බදා_බ්‍රහ_සිකු_සෙන'.split('_'),
            weekdaysMin: 'ඉ_ස_අ_බ_බ්‍ර_සි_සෙ'.split('_'),
            weekdaysParseExact: !0,
            longDateFormat: { LT: 'a h:mm', LTS: 'a h:mm:ss', L: 'YYYY/MM/DD', LL: 'YYYY MMMM D', LLL: 'YYYY MMMM D, a h:mm', LLLL: 'YYYY MMMM D [වැනි] dddd, a h:mm:ss' },
            calendar: { sameDay: '[අද] LT[ට]', nextDay: '[හෙට] LT[ට]', nextWeek: 'dddd LT[ට]', lastDay: '[ඊයේ] LT[ට]', lastWeek: '[පසුගිය] dddd LT[ට]', sameElse: 'L' },
            relativeTime: { future: '%sකින්', past: '%sකට පෙර', s: 'තත්පර කිහිපය', ss: 'තත්පර %d', m: 'මිනිත්තුව', mm: 'මිනිත්තු %d', h: 'පැය', hh: 'පැය %d', d: 'දිනය', dd: 'දින %d', M: 'මාසය', MM: 'මාස %d', y: 'වසර', yy: 'වසර %d' },
            dayOfMonthOrdinalParse: /\d{1,2} \u0dc0\u0dd0\u0db1\u0dd2/,
            ordinal: function (e) {
              return e + ' වැනි';
            },
            meridiemParse: /\u0db4\u0dd9\u0dbb \u0dc0\u0dbb\u0dd4|\u0db4\u0dc3\u0dca \u0dc0\u0dbb\u0dd4|\u0db4\u0dd9.\u0dc0|\u0db4.\u0dc0./,
            isPM: function (e) {
              return 'ප.ව.' === e || 'පස් වරු' === e;
            },
            meridiem: function (e, a, t) {
              return 11 < e ? (t ? 'ප.ව.' : 'පස් වරු') : t ? 'පෙ.ව.' : 'පෙර වරු';
            },
          });
        var Dd = 'január_február_marec_apríl_máj_jún_júl_august_september_október_november_december'.split('_'),
          Td = 'jan_feb_mar_apr_máj_jún_júl_aug_sep_okt_nov_dec'.split('_');
        function gd(e) {
          return 1 < e && e < 5;
        }
        function wd(e, a, t, s) {
          var n = e + ' ';
          switch (t) {
            case 's':
              return a || s ? 'pár sekúnd' : 'pár sekundami';
            case 'ss':
              return a || s ? n + (gd(e) ? 'sekundy' : 'sekúnd') : n + 'sekundami';
            case 'm':
              return a ? 'minúta' : s ? 'minútu' : 'minútou';
            case 'mm':
              return a || s ? n + (gd(e) ? 'minúty' : 'minút') : n + 'minútami';
            case 'h':
              return a ? 'hodina' : s ? 'hodinu' : 'hodinou';
            case 'hh':
              return a || s ? n + (gd(e) ? 'hodiny' : 'hodín') : n + 'hodinami';
            case 'd':
              return a || s ? 'deň' : 'dňom';
            case 'dd':
              return a || s ? n + (gd(e) ? 'dni' : 'dní') : n + 'dňami';
            case 'M':
              return a || s ? 'mesiac' : 'mesiacom';
            case 'MM':
              return a || s ? n + (gd(e) ? 'mesiace' : 'mesiacov') : n + 'mesiacmi';
            case 'y':
              return a || s ? 'rok' : 'rokom';
            case 'yy':
              return a || s ? n + (gd(e) ? 'roky' : 'rokov') : n + 'rokmi';
          }
        }
        function bd(e, a, t, s) {
          var n = e + ' ';
          switch (t) {
            case 's':
              return a || s ? 'nekaj sekund' : 'nekaj sekundami';
            case 'ss':
              return (n += 1 === e ? (a ? 'sekundo' : 'sekundi') : 2 === e ? (a || s ? 'sekundi' : 'sekundah') : e < 5 ? (a || s ? 'sekunde' : 'sekundah') : 'sekund');
            case 'm':
              return a ? 'ena minuta' : 'eno minuto';
            case 'mm':
              return (n += 1 === e ? (a ? 'minuta' : 'minuto') : 2 === e ? (a || s ? 'minuti' : 'minutama') : e < 5 ? (a || s ? 'minute' : 'minutami') : a || s ? 'minut' : 'minutami');
            case 'h':
              return a ? 'ena ura' : 'eno uro';
            case 'hh':
              return (n += 1 === e ? (a ? 'ura' : 'uro') : 2 === e ? (a || s ? 'uri' : 'urama') : e < 5 ? (a || s ? 'ure' : 'urami') : a || s ? 'ur' : 'urami');
            case 'd':
              return a || s ? 'en dan' : 'enim dnem';
            case 'dd':
              return (n += 1 === e ? (a || s ? 'dan' : 'dnem') : 2 === e ? (a || s ? 'dni' : 'dnevoma') : a || s ? 'dni' : 'dnevi');
            case 'M':
              return a || s ? 'en mesec' : 'enim mesecem';
            case 'MM':
              return (n += 1 === e ? (a || s ? 'mesec' : 'mesecem') : 2 === e ? (a || s ? 'meseca' : 'mesecema') : e < 5 ? (a || s ? 'mesece' : 'meseci') : a || s ? 'mesecev' : 'meseci');
            case 'y':
              return a || s ? 'eno leto' : 'enim letom';
            case 'yy':
              return (n += 1 === e ? (a || s ? 'leto' : 'letom') : 2 === e ? (a || s ? 'leti' : 'letoma') : e < 5 ? (a || s ? 'leta' : 'leti') : a || s ? 'let' : 'leti');
          }
        }
        t.defineLocale('sk', {
          months: Dd,
          monthsShort: Td,
          weekdays: 'nedeľa_pondelok_utorok_streda_štvrtok_piatok_sobota'.split('_'),
          weekdaysShort: 'ne_po_ut_st_št_pi_so'.split('_'),
          weekdaysMin: 'ne_po_ut_st_št_pi_so'.split('_'),
          longDateFormat: { LT: 'H:mm', LTS: 'H:mm:ss', L: 'DD.MM.YYYY', LL: 'D. MMMM YYYY', LLL: 'D. MMMM YYYY H:mm', LLLL: 'dddd D. MMMM YYYY H:mm' },
          calendar: {
            sameDay: '[dnes o] LT',
            nextDay: '[zajtra o] LT',
            nextWeek: function () {
              switch (this.day()) {
                case 0:
                  return '[v nedeľu o] LT';
                case 1:
                case 2:
                  return '[v] dddd [o] LT';
                case 3:
                  return '[v stredu o] LT';
                case 4:
                  return '[vo štvrtok o] LT';
                case 5:
                  return '[v piatok o] LT';
                case 6:
                  return '[v sobotu o] LT';
              }
            },
            lastDay: '[včera o] LT',
            lastWeek: function () {
              switch (this.day()) {
                case 0:
                  return '[minulú nedeľu o] LT';
                case 1:
                case 2:
                  return '[minulý] dddd [o] LT';
                case 3:
                  return '[minulú stredu o] LT';
                case 4:
                case 5:
                  return '[minulý] dddd [o] LT';
                case 6:
                  return '[minulú sobotu o] LT';
              }
            },
            sameElse: 'L',
          },
          relativeTime: { future: 'za %s', past: 'pred %s', s: wd, ss: wd, m: wd, mm: wd, h: wd, hh: wd, d: wd, dd: wd, M: wd, MM: wd, y: wd, yy: wd },
          dayOfMonthOrdinalParse: /\d{1,2}\./,
          ordinal: '%d.',
          week: { dow: 1, doy: 4 },
        }),
          t.defineLocale('sl', {
            months: 'januar_februar_marec_april_maj_junij_julij_avgust_september_oktober_november_december'.split('_'),
            monthsShort: 'jan._feb._mar._apr._maj._jun._jul._avg._sep._okt._nov._dec.'.split('_'),
            monthsParseExact: !0,
            weekdays: 'nedelja_ponedeljek_torek_sreda_četrtek_petek_sobota'.split('_'),
            weekdaysShort: 'ned._pon._tor._sre._čet._pet._sob.'.split('_'),
            weekdaysMin: 'ne_po_to_sr_če_pe_so'.split('_'),
            weekdaysParseExact: !0,
            longDateFormat: { LT: 'H:mm', LTS: 'H:mm:ss', L: 'DD. MM. YYYY', LL: 'D. MMMM YYYY', LLL: 'D. MMMM YYYY H:mm', LLLL: 'dddd, D. MMMM YYYY H:mm' },
            calendar: {
              sameDay: '[danes ob] LT',
              nextDay: '[jutri ob] LT',
              nextWeek: function () {
                switch (this.day()) {
                  case 0:
                    return '[v] [nedeljo] [ob] LT';
                  case 3:
                    return '[v] [sredo] [ob] LT';
                  case 6:
                    return '[v] [soboto] [ob] LT';
                  case 1:
                  case 2:
                  case 4:
                  case 5:
                    return '[v] dddd [ob] LT';
                }
              },
              lastDay: '[včeraj ob] LT',
              lastWeek: function () {
                switch (this.day()) {
                  case 0:
                    return '[prejšnjo] [nedeljo] [ob] LT';
                  case 3:
                    return '[prejšnjo] [sredo] [ob] LT';
                  case 6:
                    return '[prejšnjo] [soboto] [ob] LT';
                  case 1:
                  case 2:
                  case 4:
                  case 5:
                    return '[prejšnji] dddd [ob] LT';
                }
              },
              sameElse: 'L',
            },
            relativeTime: { future: 'čez %s', past: 'pred %s', s: bd, ss: bd, m: bd, mm: bd, h: bd, hh: bd, d: bd, dd: bd, M: bd, MM: bd, y: bd, yy: bd },
            dayOfMonthOrdinalParse: /\d{1,2}\./,
            ordinal: '%d.',
            week: { dow: 1, doy: 7 },
          }),
          t.defineLocale('sq', {
            months: 'Janar_Shkurt_Mars_Prill_Maj_Qershor_Korrik_Gusht_Shtator_Tetor_Nëntor_Dhjetor'.split('_'),
            monthsShort: 'Jan_Shk_Mar_Pri_Maj_Qer_Kor_Gus_Sht_Tet_Nën_Dhj'.split('_'),
            weekdays: 'E Diel_E Hënë_E Martë_E Mërkurë_E Enjte_E Premte_E Shtunë'.split('_'),
            weekdaysShort: 'Die_Hën_Mar_Mër_Enj_Pre_Sht'.split('_'),
            weekdaysMin: 'D_H_Ma_Më_E_P_Sh'.split('_'),
            weekdaysParseExact: !0,
            meridiemParse: /PD|MD/,
            isPM: function (e) {
              return 'M' === e.charAt(0);
            },
            meridiem: function (e, a, t) {
              return e < 12 ? 'PD' : 'MD';
            },
            longDateFormat: { LT: 'HH:mm', LTS: 'HH:mm:ss', L: 'DD/MM/YYYY', LL: 'D MMMM YYYY', LLL: 'D MMMM YYYY HH:mm', LLLL: 'dddd, D MMMM YYYY HH:mm' },
            calendar: { sameDay: '[Sot në] LT', nextDay: '[Nesër në] LT', nextWeek: 'dddd [në] LT', lastDay: '[Dje në] LT', lastWeek: 'dddd [e kaluar në] LT', sameElse: 'L' },
            relativeTime: { future: 'në %s', past: '%s më parë', s: 'disa sekonda', ss: '%d sekonda', m: 'një minutë', mm: '%d minuta', h: 'një orë', hh: '%d orë', d: 'një ditë', dd: '%d ditë', M: 'një muaj', MM: '%d muaj', y: 'një vit', yy: '%d vite' },
            dayOfMonthOrdinalParse: /\d{1,2}\./,
            ordinal: '%d.',
            week: { dow: 1, doy: 4 },
          });
        var vd = {
          words: { ss: ['секунда', 'секунде', 'секунди'], m: ['један минут', 'једне минуте'], mm: ['минут', 'минуте', 'минута'], h: ['један сат', 'једног сата'], hh: ['сат', 'сата', 'сати'], dd: ['дан', 'дана', 'дана'], MM: ['месец', 'месеца', 'месеци'], yy: ['година', 'године', 'година'] },
          correctGrammaticalCase: function (e, a) {
            return 1 === e ? a[0] : 2 <= e && e <= 4 ? a[1] : a[2];
          },
          translate: function (e, a, t) {
            var s = vd.words[t];
            return 1 === t.length ? (a ? s[0] : s[1]) : e + ' ' + vd.correctGrammaticalCase(e, s);
          },
        };
        t.defineLocale('sr-cyrl', {
          months: 'јануар_фебруар_март_април_мај_јун_јул_август_септембар_октобар_новембар_децембар'.split('_'),
          monthsShort: 'јан._феб._мар._апр._мај_јун_јул_авг._сеп._окт._нов._дец.'.split('_'),
          monthsParseExact: !0,
          weekdays: 'недеља_понедељак_уторак_среда_четвртак_петак_субота'.split('_'),
          weekdaysShort: 'нед._пон._уто._сре._чет._пет._суб.'.split('_'),
          weekdaysMin: 'не_по_ут_ср_че_пе_су'.split('_'),
          weekdaysParseExact: !0,
          longDateFormat: { LT: 'H:mm', LTS: 'H:mm:ss', L: 'D. M. YYYY.', LL: 'D. MMMM YYYY.', LLL: 'D. MMMM YYYY. H:mm', LLLL: 'dddd, D. MMMM YYYY. H:mm' },
          calendar: {
            sameDay: '[данас у] LT',
            nextDay: '[сутра у] LT',
            nextWeek: function () {
              switch (this.day()) {
                case 0:
                  return '[у] [недељу] [у] LT';
                case 3:
                  return '[у] [среду] [у] LT';
                case 6:
                  return '[у] [суботу] [у] LT';
                case 1:
                case 2:
                case 4:
                case 5:
                  return '[у] dddd [у] LT';
              }
            },
            lastDay: '[јуче у] LT',
            lastWeek: function () {
              return ['[прошле] [недеље] [у] LT', '[прошлог] [понедељка] [у] LT', '[прошлог] [уторка] [у] LT', '[прошле] [среде] [у] LT', '[прошлог] [четвртка] [у] LT', '[прошлог] [петка] [у] LT', '[прошле] [суботе] [у] LT'][this.day()];
            },
            sameElse: 'L',
          },
          relativeTime: { future: 'за %s', past: 'пре %s', s: 'неколико секунди', ss: vd.translate, m: vd.translate, mm: vd.translate, h: vd.translate, hh: vd.translate, d: 'дан', dd: vd.translate, M: 'месец', MM: vd.translate, y: 'годину', yy: vd.translate },
          dayOfMonthOrdinalParse: /\d{1,2}\./,
          ordinal: '%d.',
          week: { dow: 1, doy: 7 },
        });
        var Sd = {
          words: { ss: ['sekunda', 'sekunde', 'sekundi'], m: ['jedan minut', 'jedne minute'], mm: ['minut', 'minute', 'minuta'], h: ['jedan sat', 'jednog sata'], hh: ['sat', 'sata', 'sati'], dd: ['dan', 'dana', 'dana'], MM: ['mesec', 'meseca', 'meseci'], yy: ['godina', 'godine', 'godina'] },
          correctGrammaticalCase: function (e, a) {
            return 1 === e ? a[0] : 2 <= e && e <= 4 ? a[1] : a[2];
          },
          translate: function (e, a, t) {
            var s = Sd.words[t];
            return 1 === t.length ? (a ? s[0] : s[1]) : e + ' ' + Sd.correctGrammaticalCase(e, s);
          },
        };
        t.defineLocale('sr', {
          months: 'januar_februar_mart_april_maj_jun_jul_avgust_septembar_oktobar_novembar_decembar'.split('_'),
          monthsShort: 'jan._feb._mar._apr._maj_jun_jul_avg._sep._okt._nov._dec.'.split('_'),
          monthsParseExact: !0,
          weekdays: 'nedelja_ponedeljak_utorak_sreda_četvrtak_petak_subota'.split('_'),
          weekdaysShort: 'ned._pon._uto._sre._čet._pet._sub.'.split('_'),
          weekdaysMin: 'ne_po_ut_sr_če_pe_su'.split('_'),
          weekdaysParseExact: !0,
          longDateFormat: { LT: 'H:mm', LTS: 'H:mm:ss', L: 'D. M. YYYY.', LL: 'D. MMMM YYYY.', LLL: 'D. MMMM YYYY. H:mm', LLLL: 'dddd, D. MMMM YYYY. H:mm' },
          calendar: {
            sameDay: '[danas u] LT',
            nextDay: '[sutra u] LT',
            nextWeek: function () {
              switch (this.day()) {
                case 0:
                  return '[u] [nedelju] [u] LT';
                case 3:
                  return '[u] [sredu] [u] LT';
                case 6:
                  return '[u] [subotu] [u] LT';
                case 1:
                case 2:
                case 4:
                case 5:
                  return '[u] dddd [u] LT';
              }
            },
            lastDay: '[juče u] LT',
            lastWeek: function () {
              return ['[prošle] [nedelje] [u] LT', '[prošlog] [ponedeljka] [u] LT', '[prošlog] [utorka] [u] LT', '[prošle] [srede] [u] LT', '[prošlog] [četvrtka] [u] LT', '[prošlog] [petka] [u] LT', '[prošle] [subote] [u] LT'][this.day()];
            },
            sameElse: 'L',
          },
          relativeTime: { future: 'za %s', past: 'pre %s', s: 'nekoliko sekundi', ss: Sd.translate, m: Sd.translate, mm: Sd.translate, h: Sd.translate, hh: Sd.translate, d: 'dan', dd: Sd.translate, M: 'mesec', MM: Sd.translate, y: 'godinu', yy: Sd.translate },
          dayOfMonthOrdinalParse: /\d{1,2}\./,
          ordinal: '%d.',
          week: { dow: 1, doy: 7 },
        }),
          t.defineLocale('ss', {
            months: "Bhimbidvwane_Indlovana_Indlov'lenkhulu_Mabasa_Inkhwekhweti_Inhlaba_Kholwane_Ingci_Inyoni_Imphala_Lweti_Ingongoni".split('_'),
            monthsShort: 'Bhi_Ina_Inu_Mab_Ink_Inh_Kho_Igc_Iny_Imp_Lwe_Igo'.split('_'),
            weekdays: 'Lisontfo_Umsombuluko_Lesibili_Lesitsatfu_Lesine_Lesihlanu_Umgcibelo'.split('_'),
            weekdaysShort: 'Lis_Umb_Lsb_Les_Lsi_Lsh_Umg'.split('_'),
            weekdaysMin: 'Li_Us_Lb_Lt_Ls_Lh_Ug'.split('_'),
            weekdaysParseExact: !0,
            longDateFormat: { LT: 'h:mm A', LTS: 'h:mm:ss A', L: 'DD/MM/YYYY', LL: 'D MMMM YYYY', LLL: 'D MMMM YYYY h:mm A', LLLL: 'dddd, D MMMM YYYY h:mm A' },
            calendar: { sameDay: '[Namuhla nga] LT', nextDay: '[Kusasa nga] LT', nextWeek: 'dddd [nga] LT', lastDay: '[Itolo nga] LT', lastWeek: 'dddd [leliphelile] [nga] LT', sameElse: 'L' },
            relativeTime: { future: 'nga %s', past: 'wenteka nga %s', s: 'emizuzwana lomcane', ss: '%d mzuzwana', m: 'umzuzu', mm: '%d emizuzu', h: 'lihora', hh: '%d emahora', d: 'lilanga', dd: '%d emalanga', M: 'inyanga', MM: '%d tinyanga', y: 'umnyaka', yy: '%d iminyaka' },
            meridiemParse: /ekuseni|emini|entsambama|ebusuku/,
            meridiem: function (e, a, t) {
              return e < 11 ? 'ekuseni' : e < 15 ? 'emini' : e < 19 ? 'entsambama' : 'ebusuku';
            },
            meridiemHour: function (e, a) {
              return 12 === e && (e = 0), 'ekuseni' === a ? e : 'emini' === a ? (11 <= e ? e : e + 12) : 'entsambama' === a || 'ebusuku' === a ? (0 === e ? 0 : e + 12) : void 0;
            },
            dayOfMonthOrdinalParse: /\d{1,2}/,
            ordinal: '%d',
            week: { dow: 1, doy: 4 },
          }),
          t.defineLocale('sv', {
            months: 'januari_februari_mars_april_maj_juni_juli_augusti_september_oktober_november_december'.split('_'),
            monthsShort: 'jan_feb_mar_apr_maj_jun_jul_aug_sep_okt_nov_dec'.split('_'),
            weekdays: 'söndag_måndag_tisdag_onsdag_torsdag_fredag_lördag'.split('_'),
            weekdaysShort: 'sön_mån_tis_ons_tor_fre_lör'.split('_'),
            weekdaysMin: 'sö_må_ti_on_to_fr_lö'.split('_'),
            longDateFormat: { LT: 'HH:mm', LTS: 'HH:mm:ss', L: 'YYYY-MM-DD', LL: 'D MMMM YYYY', LLL: 'D MMMM YYYY [kl.] HH:mm', LLLL: 'dddd D MMMM YYYY [kl.] HH:mm', lll: 'D MMM YYYY HH:mm', llll: 'ddd D MMM YYYY HH:mm' },
            calendar: { sameDay: '[Idag] LT', nextDay: '[Imorgon] LT', lastDay: '[Igår] LT', nextWeek: '[På] dddd LT', lastWeek: '[I] dddd[s] LT', sameElse: 'L' },
            relativeTime: { future: 'om %s', past: 'för %s sedan', s: 'några sekunder', ss: '%d sekunder', m: 'en minut', mm: '%d minuter', h: 'en timme', hh: '%d timmar', d: 'en dag', dd: '%d dagar', M: 'en månad', MM: '%d månader', y: 'ett år', yy: '%d år' },
            dayOfMonthOrdinalParse: /\d{1,2}(\:e|\:a)/,
            ordinal: function (e) {
              var a = e % 10;
              return e + (1 != ~~((e % 100) / 10) && (1 == a || 2 == a) ? ':a' : ':e');
            },
            week: { dow: 1, doy: 4 },
          }),
          t.defineLocale('sw', {
            months: 'Januari_Februari_Machi_Aprili_Mei_Juni_Julai_Agosti_Septemba_Oktoba_Novemba_Desemba'.split('_'),
            monthsShort: 'Jan_Feb_Mac_Apr_Mei_Jun_Jul_Ago_Sep_Okt_Nov_Des'.split('_'),
            weekdays: 'Jumapili_Jumatatu_Jumanne_Jumatano_Alhamisi_Ijumaa_Jumamosi'.split('_'),
            weekdaysShort: 'Jpl_Jtat_Jnne_Jtan_Alh_Ijm_Jmos'.split('_'),
            weekdaysMin: 'J2_J3_J4_J5_Al_Ij_J1'.split('_'),
            weekdaysParseExact: !0,
            longDateFormat: { LT: 'hh:mm A', LTS: 'HH:mm:ss', L: 'DD.MM.YYYY', LL: 'D MMMM YYYY', LLL: 'D MMMM YYYY HH:mm', LLLL: 'dddd, D MMMM YYYY HH:mm' },
            calendar: { sameDay: '[leo saa] LT', nextDay: '[kesho saa] LT', nextWeek: '[wiki ijayo] dddd [saat] LT', lastDay: '[jana] LT', lastWeek: '[wiki iliyopita] dddd [saat] LT', sameElse: 'L' },
            relativeTime: { future: '%s baadaye', past: 'tokea %s', s: 'hivi punde', ss: 'sekunde %d', m: 'dakika moja', mm: 'dakika %d', h: 'saa limoja', hh: 'masaa %d', d: 'siku moja', dd: 'siku %d', M: 'mwezi mmoja', MM: 'miezi %d', y: 'mwaka mmoja', yy: 'miaka %d' },
            week: { dow: 1, doy: 7 },
          });
        var Hd = { 1: '௧', 2: '௨', 3: '௩', 4: '௪', 5: '௫', 6: '௬', 7: '௭', 8: '௮', 9: '௯', 0: '௦' },
          jd = { '௧': '1', '௨': '2', '௩': '3', '௪': '4', '௫': '5', '௬': '6', '௭': '7', '௮': '8', '௯': '9', '௦': '0' };
        t.defineLocale('ta', {
          months: 'ஜனவரி_பிப்ரவரி_மார்ச்_ஏப்ரல்_மே_ஜூன்_ஜூலை_ஆகஸ்ட்_செப்டெம்பர்_அக்டோபர்_நவம்பர்_டிசம்பர்'.split('_'),
          monthsShort: 'ஜனவரி_பிப்ரவரி_மார்ச்_ஏப்ரல்_மே_ஜூன்_ஜூலை_ஆகஸ்ட்_செப்டெம்பர்_அக்டோபர்_நவம்பர்_டிசம்பர்'.split('_'),
          weekdays: 'ஞாயிற்றுக்கிழமை_திங்கட்கிழமை_செவ்வாய்கிழமை_புதன்கிழமை_வியாழக்கிழமை_வெள்ளிக்கிழமை_சனிக்கிழமை'.split('_'),
          weekdaysShort: 'ஞாயிறு_திங்கள்_செவ்வாய்_புதன்_வியாழன்_வெள்ளி_சனி'.split('_'),
          weekdaysMin: 'ஞா_தி_செ_பு_வி_வெ_ச'.split('_'),
          longDateFormat: { LT: 'HH:mm', LTS: 'HH:mm:ss', L: 'DD/MM/YYYY', LL: 'D MMMM YYYY', LLL: 'D MMMM YYYY, HH:mm', LLLL: 'dddd, D MMMM YYYY, HH:mm' },
          calendar: { sameDay: '[இன்று] LT', nextDay: '[நாளை] LT', nextWeek: 'dddd, LT', lastDay: '[நேற்று] LT', lastWeek: '[கடந்த வாரம்] dddd, LT', sameElse: 'L' },
          relativeTime: { future: '%s இல்', past: '%s முன்', s: 'ஒரு சில விநாடிகள்', ss: '%d விநாடிகள்', m: 'ஒரு நிமிடம்', mm: '%d நிமிடங்கள்', h: 'ஒரு மணி நேரம்', hh: '%d மணி நேரம்', d: 'ஒரு நாள்', dd: '%d நாட்கள்', M: 'ஒரு மாதம்', MM: '%d மாதங்கள்', y: 'ஒரு வருடம்', yy: '%d ஆண்டுகள்' },
          dayOfMonthOrdinalParse: /\d{1,2}\u0bb5\u0ba4\u0bc1/,
          ordinal: function (e) {
            return e + 'வது';
          },
          preparse: function (e) {
            return e.replace(/[\u0be7\u0be8\u0be9\u0bea\u0beb\u0bec\u0bed\u0bee\u0bef\u0be6]/g, function (e) {
              return jd[e];
            });
          },
          postformat: function (e) {
            return e.replace(/\d/g, function (e) {
              return Hd[e];
            });
          },
          meridiemParse: /\u0baf\u0bbe\u0bae\u0bae\u0bcd|\u0bb5\u0bc8\u0b95\u0bb1\u0bc8|\u0b95\u0bbe\u0bb2\u0bc8|\u0ba8\u0ba3\u0bcd\u0baa\u0b95\u0bb2\u0bcd|\u0b8e\u0bb1\u0bcd\u0baa\u0bbe\u0b9f\u0bc1|\u0bae\u0bbe\u0bb2\u0bc8/,
          meridiem: function (e, a, t) {
            return e < 2 ? ' யாமம்' : e < 6 ? ' வைகறை' : e < 10 ? ' காலை' : e < 14 ? ' நண்பகல்' : e < 18 ? ' எற்பாடு' : e < 22 ? ' மாலை' : ' யாமம்';
          },
          meridiemHour: function (e, a) {
            return 12 === e && (e = 0), 'யாமம்' === a ? (e < 2 ? e : e + 12) : 'வைகறை' === a || 'காலை' === a || ('நண்பகல்' === a && 10 <= e) ? e : e + 12;
          },
          week: { dow: 0, doy: 6 },
        }),
          t.defineLocale('te', {
            months: 'జనవరి_ఫిబ్రవరి_మార్చి_ఏప్రిల్_మే_జూన్_జులై_ఆగస్టు_సెప్టెంబర్_అక్టోబర్_నవంబర్_డిసెంబర్'.split('_'),
            monthsShort: 'జన._ఫిబ్ర._మార్చి_ఏప్రి._మే_జూన్_జులై_ఆగ._సెప్._అక్టో._నవ._డిసె.'.split('_'),
            monthsParseExact: !0,
            weekdays: 'ఆదివారం_సోమవారం_మంగళవారం_బుధవారం_గురువారం_శుక్రవారం_శనివారం'.split('_'),
            weekdaysShort: 'ఆది_సోమ_మంగళ_బుధ_గురు_శుక్ర_శని'.split('_'),
            weekdaysMin: 'ఆ_సో_మం_బు_గు_శు_శ'.split('_'),
            longDateFormat: { LT: 'A h:mm', LTS: 'A h:mm:ss', L: 'DD/MM/YYYY', LL: 'D MMMM YYYY', LLL: 'D MMMM YYYY, A h:mm', LLLL: 'dddd, D MMMM YYYY, A h:mm' },
            calendar: { sameDay: '[నేడు] LT', nextDay: '[రేపు] LT', nextWeek: 'dddd, LT', lastDay: '[నిన్న] LT', lastWeek: '[గత] dddd, LT', sameElse: 'L' },
            relativeTime: { future: '%s లో', past: '%s క్రితం', s: 'కొన్ని క్షణాలు', ss: '%d సెకన్లు', m: 'ఒక నిమిషం', mm: '%d నిమిషాలు', h: 'ఒక గంట', hh: '%d గంటలు', d: 'ఒక రోజు', dd: '%d రోజులు', M: 'ఒక నెల', MM: '%d నెలలు', y: 'ఒక సంవత్సరం', yy: '%d సంవత్సరాలు' },
            dayOfMonthOrdinalParse: /\d{1,2}\u0c35/,
            ordinal: '%dవ',
            meridiemParse: /\u0c30\u0c3e\u0c24\u0c4d\u0c30\u0c3f|\u0c09\u0c26\u0c2f\u0c02|\u0c2e\u0c27\u0c4d\u0c2f\u0c3e\u0c39\u0c4d\u0c28\u0c02|\u0c38\u0c3e\u0c2f\u0c02\u0c24\u0c4d\u0c30\u0c02/,
            meridiemHour: function (e, a) {
              return 12 === e && (e = 0), 'రాత్రి' === a ? (e < 4 ? e : e + 12) : 'ఉదయం' === a ? e : 'మధ్యాహ్నం' === a ? (10 <= e ? e : e + 12) : 'సాయంత్రం' === a ? e + 12 : void 0;
            },
            meridiem: function (e, a, t) {
              return e < 4 ? 'రాత్రి' : e < 10 ? 'ఉదయం' : e < 17 ? 'మధ్యాహ్నం' : e < 20 ? 'సాయంత్రం' : 'రాత్రి';
            },
            week: { dow: 0, doy: 6 },
          }),
          t.defineLocale('tet', {
            months: 'Janeiru_Fevereiru_Marsu_Abril_Maiu_Juñu_Jullu_Agustu_Setembru_Outubru_Novembru_Dezembru'.split('_'),
            monthsShort: 'Jan_Fev_Mar_Abr_Mai_Jun_Jul_Ago_Set_Out_Nov_Dez'.split('_'),
            weekdays: 'Domingu_Segunda_Tersa_Kuarta_Kinta_Sesta_Sabadu'.split('_'),
            weekdaysShort: 'Dom_Seg_Ters_Kua_Kint_Sest_Sab'.split('_'),
            weekdaysMin: 'Do_Seg_Te_Ku_Ki_Ses_Sa'.split('_'),
            longDateFormat: { LT: 'HH:mm', LTS: 'HH:mm:ss', L: 'DD/MM/YYYY', LL: 'D MMMM YYYY', LLL: 'D MMMM YYYY HH:mm', LLLL: 'dddd, D MMMM YYYY HH:mm' },
            calendar: { sameDay: '[Ohin iha] LT', nextDay: '[Aban iha] LT', nextWeek: 'dddd [iha] LT', lastDay: '[Horiseik iha] LT', lastWeek: 'dddd [semana kotuk] [iha] LT', sameElse: 'L' },
            relativeTime: { future: 'iha %s', past: '%s liuba', s: 'segundu balun', ss: 'segundu %d', m: 'minutu ida', mm: 'minutu %d', h: 'oras ida', hh: 'oras %d', d: 'loron ida', dd: 'loron %d', M: 'fulan ida', MM: 'fulan %d', y: 'tinan ida', yy: 'tinan %d' },
            dayOfMonthOrdinalParse: /\d{1,2}(st|nd|rd|th)/,
            ordinal: function (e) {
              var a = e % 10;
              return e + (1 == ~~((e % 100) / 10) ? 'th' : 1 == a ? 'st' : 2 == a ? 'nd' : 3 == a ? 'rd' : 'th');
            },
            week: { dow: 1, doy: 4 },
          });
        var xd = { 0: '-ум', 1: '-ум', 2: '-юм', 3: '-юм', 4: '-ум', 5: '-ум', 6: '-ум', 7: '-ум', 8: '-ум', 9: '-ум', 10: '-ум', 12: '-ум', 13: '-ум', 20: '-ум', 30: '-юм', 40: '-ум', 50: '-ум', 60: '-ум', 70: '-ум', 80: '-ум', 90: '-ум', 100: '-ум' };
        t.defineLocale('tg', {
          months: { format: 'январи_феврали_марти_апрели_майи_июни_июли_августи_сентябри_октябри_ноябри_декабри'.split('_'), standalone: 'январ_феврал_март_апрел_май_июн_июл_август_сентябр_октябр_ноябр_декабр'.split('_') },
          monthsShort: 'янв_фев_мар_апр_май_июн_июл_авг_сен_окт_ноя_дек'.split('_'),
          weekdays: 'якшанбе_душанбе_сешанбе_чоршанбе_панҷшанбе_ҷумъа_шанбе'.split('_'),
          weekdaysShort: 'яшб_дшб_сшб_чшб_пшб_ҷум_шнб'.split('_'),
          weekdaysMin: 'яш_дш_сш_чш_пш_ҷм_шб'.split('_'),
          longDateFormat: { LT: 'HH:mm', LTS: 'HH:mm:ss', L: 'DD.MM.YYYY', LL: 'D MMMM YYYY', LLL: 'D MMMM YYYY HH:mm', LLLL: 'dddd, D MMMM YYYY HH:mm' },
          calendar: { sameDay: '[Имрӯз соати] LT', nextDay: '[Фардо соати] LT', lastDay: '[Дирӯз соати] LT', nextWeek: 'dddd[и] [ҳафтаи оянда соати] LT', lastWeek: 'dddd[и] [ҳафтаи гузашта соати] LT', sameElse: 'L' },
          relativeTime: { future: 'баъди %s', past: '%s пеш', s: 'якчанд сония', m: 'як дақиқа', mm: '%d дақиқа', h: 'як соат', hh: '%d соат', d: 'як рӯз', dd: '%d рӯз', M: 'як моҳ', MM: '%d моҳ', y: 'як сол', yy: '%d сол' },
          meridiemParse: /\u0448\u0430\u0431|\u0441\u0443\u0431\u04b3|\u0440\u04ef\u0437|\u0431\u0435\u0433\u043e\u04b3/,
          meridiemHour: function (e, a) {
            return 12 === e && (e = 0), 'шаб' === a ? (e < 4 ? e : e + 12) : 'субҳ' === a ? e : 'рӯз' === a ? (11 <= e ? e : e + 12) : 'бегоҳ' === a ? e + 12 : void 0;
          },
          meridiem: function (e, a, t) {
            return e < 4 ? 'шаб' : e < 11 ? 'субҳ' : e < 16 ? 'рӯз' : e < 19 ? 'бегоҳ' : 'шаб';
          },
          dayOfMonthOrdinalParse: /\d{1,2}-(\u0443\u043c|\u044e\u043c)/,
          ordinal: function (e) {
            return e + (xd[e] || xd[e % 10] || xd[100 <= e ? 100 : null]);
          },
          week: { dow: 1, doy: 7 },
        }),
          t.defineLocale('th', {
            months: 'มกราคม_กุมภาพันธ์_มีนาคม_เมษายน_พฤษภาคม_มิถุนายน_กรกฎาคม_สิงหาคม_กันยายน_ตุลาคม_พฤศจิกายน_ธันวาคม'.split('_'),
            monthsShort: 'ม.ค._ก.พ._มี.ค._เม.ย._พ.ค._มิ.ย._ก.ค._ส.ค._ก.ย._ต.ค._พ.ย._ธ.ค.'.split('_'),
            monthsParseExact: !0,
            weekdays: 'อาทิตย์_จันทร์_อังคาร_พุธ_พฤหัสบดี_ศุกร์_เสาร์'.split('_'),
            weekdaysShort: 'อาทิตย์_จันทร์_อังคาร_พุธ_พฤหัส_ศุกร์_เสาร์'.split('_'),
            weekdaysMin: 'อา._จ._อ._พ._พฤ._ศ._ส.'.split('_'),
            weekdaysParseExact: !0,
            longDateFormat: { LT: 'H:mm', LTS: 'H:mm:ss', L: 'DD/MM/YYYY', LL: 'D MMMM YYYY', LLL: 'D MMMM YYYY เวลา H:mm', LLLL: 'วันddddที่ D MMMM YYYY เวลา H:mm' },
            meridiemParse: /\u0e01\u0e48\u0e2d\u0e19\u0e40\u0e17\u0e35\u0e48\u0e22\u0e07|\u0e2b\u0e25\u0e31\u0e07\u0e40\u0e17\u0e35\u0e48\u0e22\u0e07/,
            isPM: function (e) {
              return 'หลังเที่ยง' === e;
            },
            meridiem: function (e, a, t) {
              return e < 12 ? 'ก่อนเที่ยง' : 'หลังเที่ยง';
            },
            calendar: { sameDay: '[วันนี้ เวลา] LT', nextDay: '[พรุ่งนี้ เวลา] LT', nextWeek: 'dddd[หน้า เวลา] LT', lastDay: '[เมื่อวานนี้ เวลา] LT', lastWeek: '[วัน]dddd[ที่แล้ว เวลา] LT', sameElse: 'L' },
            relativeTime: { future: 'อีก %s', past: '%sที่แล้ว', s: 'ไม่กี่วินาที', ss: '%d วินาที', m: '1 นาที', mm: '%d นาที', h: '1 ชั่วโมง', hh: '%d ชั่วโมง', d: '1 วัน', dd: '%d วัน', w: '1 สัปดาห์', ww: '%d สัปดาห์', M: '1 เดือน', MM: '%d เดือน', y: '1 ปี', yy: '%d ปี' },
          });
        var Pd = { 1: "'inji", 5: "'inji", 8: "'inji", 70: "'inji", 80: "'inji", 2: "'nji", 7: "'nji", 20: "'nji", 50: "'nji", 3: "'ünji", 4: "'ünji", 100: "'ünji", 6: "'njy", 9: "'unjy", 10: "'unjy", 30: "'unjy", 60: "'ynjy", 90: "'ynjy" };
        t.defineLocale('tk', {
          months: 'Ýanwar_Fewral_Mart_Aprel_Maý_Iýun_Iýul_Awgust_Sentýabr_Oktýabr_Noýabr_Dekabr'.split('_'),
          monthsShort: 'Ýan_Few_Mar_Apr_Maý_Iýn_Iýl_Awg_Sen_Okt_Noý_Dek'.split('_'),
          weekdays: 'Ýekşenbe_Duşenbe_Sişenbe_Çarşenbe_Penşenbe_Anna_Şenbe'.split('_'),
          weekdaysShort: 'Ýek_Duş_Siş_Çar_Pen_Ann_Şen'.split('_'),
          weekdaysMin: 'Ýk_Dş_Sş_Çr_Pn_An_Şn'.split('_'),
          longDateFormat: { LT: 'HH:mm', LTS: 'HH:mm:ss', L: 'DD.MM.YYYY', LL: 'D MMMM YYYY', LLL: 'D MMMM YYYY HH:mm', LLLL: 'dddd, D MMMM YYYY HH:mm' },
          calendar: { sameDay: '[bugün sagat] LT', nextDay: '[ertir sagat] LT', nextWeek: '[indiki] dddd [sagat] LT', lastDay: '[düýn] LT', lastWeek: '[geçen] dddd [sagat] LT', sameElse: 'L' },
          relativeTime: { future: '%s soň', past: '%s öň', s: 'birnäçe sekunt', m: 'bir minut', mm: '%d minut', h: 'bir sagat', hh: '%d sagat', d: 'bir gün', dd: '%d gün', M: 'bir aý', MM: '%d aý', y: 'bir ýyl', yy: '%d ýyl' },
          ordinal: function (e, a) {
            switch (a) {
              case 'd':
              case 'D':
              case 'Do':
              case 'DD':
                return e;
              default:
                if (0 === e) return e + "'unjy";
                var t = e % 10;
                return e + (Pd[t] || Pd[(e % 100) - t] || Pd[100 <= e ? 100 : null]);
            }
          },
          week: { dow: 1, doy: 7 },
        }),
          t.defineLocale('tl-ph', {
            months: 'Enero_Pebrero_Marso_Abril_Mayo_Hunyo_Hulyo_Agosto_Setyembre_Oktubre_Nobyembre_Disyembre'.split('_'),
            monthsShort: 'Ene_Peb_Mar_Abr_May_Hun_Hul_Ago_Set_Okt_Nob_Dis'.split('_'),
            weekdays: 'Linggo_Lunes_Martes_Miyerkules_Huwebes_Biyernes_Sabado'.split('_'),
            weekdaysShort: 'Lin_Lun_Mar_Miy_Huw_Biy_Sab'.split('_'),
            weekdaysMin: 'Li_Lu_Ma_Mi_Hu_Bi_Sab'.split('_'),
            longDateFormat: { LT: 'HH:mm', LTS: 'HH:mm:ss', L: 'MM/D/YYYY', LL: 'MMMM D, YYYY', LLL: 'MMMM D, YYYY HH:mm', LLLL: 'dddd, MMMM DD, YYYY HH:mm' },
            calendar: { sameDay: 'LT [ngayong araw]', nextDay: '[Bukas ng] LT', nextWeek: 'LT [sa susunod na] dddd', lastDay: 'LT [kahapon]', lastWeek: 'LT [noong nakaraang] dddd', sameElse: 'L' },
            relativeTime: { future: 'sa loob ng %s', past: '%s ang nakalipas', s: 'ilang segundo', ss: '%d segundo', m: 'isang minuto', mm: '%d minuto', h: 'isang oras', hh: '%d oras', d: 'isang araw', dd: '%d araw', M: 'isang buwan', MM: '%d buwan', y: 'isang taon', yy: '%d taon' },
            dayOfMonthOrdinalParse: /\d{1,2}/,
            ordinal: function (e) {
              return e;
            },
            week: { dow: 1, doy: 4 },
          });
        var Od = 'pagh_wa’_cha’_wej_loS_vagh_jav_Soch_chorgh_Hut'.split('_');
        function Wd(e, a, t, s) {
          var n = (function (e) {
            var a = Math.floor((e % 1e3) / 100),
              t = Math.floor((e % 100) / 10),
              s = e % 10,
              n = '';
            0 < a && (n += Od[a] + 'vatlh');
            0 < t && (n += ('' !== n ? ' ' : '') + Od[t] + 'maH');
            0 < s && (n += ('' !== n ? ' ' : '') + Od[s]);
            return '' === n ? 'pagh' : n;
          })(e);
          switch (t) {
            case 'ss':
              return n + ' lup';
            case 'mm':
              return n + ' tup';
            case 'hh':
              return n + ' rep';
            case 'dd':
              return n + ' jaj';
            case 'MM':
              return n + ' jar';
            case 'yy':
              return n + ' DIS';
          }
        }
        t.defineLocale('tlh', {
          months: 'tera’ jar wa’_tera’ jar cha’_tera’ jar wej_tera’ jar loS_tera’ jar vagh_tera’ jar jav_tera’ jar Soch_tera’ jar chorgh_tera’ jar Hut_tera’ jar wa’maH_tera’ jar wa’maH wa’_tera’ jar wa’maH cha’'.split('_'),
          monthsShort: 'jar wa’_jar cha’_jar wej_jar loS_jar vagh_jar jav_jar Soch_jar chorgh_jar Hut_jar wa’maH_jar wa’maH wa’_jar wa’maH cha’'.split('_'),
          monthsParseExact: !0,
          weekdays: 'lojmItjaj_DaSjaj_povjaj_ghItlhjaj_loghjaj_buqjaj_ghInjaj'.split('_'),
          weekdaysShort: 'lojmItjaj_DaSjaj_povjaj_ghItlhjaj_loghjaj_buqjaj_ghInjaj'.split('_'),
          weekdaysMin: 'lojmItjaj_DaSjaj_povjaj_ghItlhjaj_loghjaj_buqjaj_ghInjaj'.split('_'),
          longDateFormat: { LT: 'HH:mm', LTS: 'HH:mm:ss', L: 'DD.MM.YYYY', LL: 'D MMMM YYYY', LLL: 'D MMMM YYYY HH:mm', LLLL: 'dddd, D MMMM YYYY HH:mm' },
          calendar: { sameDay: '[DaHjaj] LT', nextDay: '[wa’leS] LT', nextWeek: 'LLL', lastDay: '[wa’Hu’] LT', lastWeek: 'LLL', sameElse: 'L' },
          relativeTime: {
            future: function (e) {
              var a = e;
              return (a = -1 !== e.indexOf('jaj') ? a.slice(0, -3) + 'leS' : -1 !== e.indexOf('jar') ? a.slice(0, -3) + 'waQ' : -1 !== e.indexOf('DIS') ? a.slice(0, -3) + 'nem' : a + ' pIq');
            },
            past: function (e) {
              var a = e;
              return (a = -1 !== e.indexOf('jaj') ? a.slice(0, -3) + 'Hu’' : -1 !== e.indexOf('jar') ? a.slice(0, -3) + 'wen' : -1 !== e.indexOf('DIS') ? a.slice(0, -3) + 'ben' : a + ' ret');
            },
            s: 'puS lup',
            ss: Wd,
            m: 'wa’ tup',
            mm: Wd,
            h: 'wa’ rep',
            hh: Wd,
            d: 'wa’ jaj',
            dd: Wd,
            M: 'wa’ jar',
            MM: Wd,
            y: 'wa’ DIS',
            yy: Wd,
          },
          dayOfMonthOrdinalParse: /\d{1,2}\./,
          ordinal: '%d.',
          week: { dow: 1, doy: 4 },
        });
        var Ad = { 1: "'inci", 5: "'inci", 8: "'inci", 70: "'inci", 80: "'inci", 2: "'nci", 7: "'nci", 20: "'nci", 50: "'nci", 3: "'üncü", 4: "'üncü", 100: "'üncü", 6: "'ncı", 9: "'uncu", 10: "'uncu", 30: "'uncu", 60: "'ıncı", 90: "'ıncı" };
        function Ed(e, a, t, s) {
          var n = {
            s: ['viensas secunds', "'iensas secunds"],
            ss: [e + ' secunds', e + ' secunds'],
            m: ["'n míut", "'iens míut"],
            mm: [e + ' míuts', e + ' míuts'],
            h: ["'n þora", "'iensa þora"],
            hh: [e + ' þoras', e + ' þoras'],
            d: ["'n ziua", "'iensa ziua"],
            dd: [e + ' ziuas', e + ' ziuas'],
            M: ["'n mes", "'iens mes"],
            MM: [e + ' mesen', e + ' mesen'],
            y: ["'n ar", "'iens ar"],
            yy: [e + ' ars', e + ' ars'],
          };
          return s || a ? n[t][0] : n[t][1];
        }
        function Fd(e, a, t) {
          var s, n;
          return 'm' === t
            ? a
              ? 'хвилина'
              : 'хвилину'
            : 'h' === t
            ? a
              ? 'година'
              : 'годину'
            : e +
              ' ' +
              ((s = +e),
              (n = { ss: a ? 'секунда_секунди_секунд' : 'секунду_секунди_секунд', mm: a ? 'хвилина_хвилини_хвилин' : 'хвилину_хвилини_хвилин', hh: a ? 'година_години_годин' : 'годину_години_годин', dd: 'день_дні_днів', MM: 'місяць_місяці_місяців', yy: 'рік_роки_років' }[t].split('_')),
              s % 10 == 1 && s % 100 != 11 ? n[0] : 2 <= s % 10 && s % 10 <= 4 && (s % 100 < 10 || 20 <= s % 100) ? n[1] : n[2]);
        }
        function zd(e) {
          return function () {
            return e + 'о' + (11 === this.hours() ? 'б' : '') + '] LT';
          };
        }
        t.defineLocale('tr', {
          months: 'Ocak_Şubat_Mart_Nisan_Mayıs_Haziran_Temmuz_Ağustos_Eylül_Ekim_Kasım_Aralık'.split('_'),
          monthsShort: 'Oca_Şub_Mar_Nis_May_Haz_Tem_Ağu_Eyl_Eki_Kas_Ara'.split('_'),
          weekdays: 'Pazar_Pazartesi_Salı_Çarşamba_Perşembe_Cuma_Cumartesi'.split('_'),
          weekdaysShort: 'Paz_Pts_Sal_Çar_Per_Cum_Cts'.split('_'),
          weekdaysMin: 'Pz_Pt_Sa_Ça_Pe_Cu_Ct'.split('_'),
          meridiem: function (e, a, t) {
            return e < 12 ? (t ? 'öö' : 'ÖÖ') : t ? 'ös' : 'ÖS';
          },
          meridiemParse: /\xf6\xf6|\xd6\xd6|\xf6s|\xd6S/,
          isPM: function (e) {
            return 'ös' === e || 'ÖS' === e;
          },
          longDateFormat: { LT: 'HH:mm', LTS: 'HH:mm:ss', L: 'DD.MM.YYYY', LL: 'D MMMM YYYY', LLL: 'D MMMM YYYY HH:mm', LLLL: 'dddd, D MMMM YYYY HH:mm' },
          calendar: { sameDay: '[bugün saat] LT', nextDay: '[yarın saat] LT', nextWeek: '[gelecek] dddd [saat] LT', lastDay: '[dün] LT', lastWeek: '[geçen] dddd [saat] LT', sameElse: 'L' },
          relativeTime: { future: '%s sonra', past: '%s önce', s: 'birkaç saniye', ss: '%d saniye', m: 'bir dakika', mm: '%d dakika', h: 'bir saat', hh: '%d saat', d: 'bir gün', dd: '%d gün', w: 'bir hafta', ww: '%d hafta', M: 'bir ay', MM: '%d ay', y: 'bir yıl', yy: '%d yıl' },
          ordinal: function (e, a) {
            switch (a) {
              case 'd':
              case 'D':
              case 'Do':
              case 'DD':
                return e;
              default:
                if (0 === e) return e + "'ıncı";
                var t = e % 10;
                return e + (Ad[t] || Ad[(e % 100) - t] || Ad[100 <= e ? 100 : null]);
            }
          },
          week: { dow: 1, doy: 7 },
        }),
          t.defineLocale('tzl', {
            months: 'Januar_Fevraglh_Març_Avrïu_Mai_Gün_Julia_Guscht_Setemvar_Listopäts_Noemvar_Zecemvar'.split('_'),
            monthsShort: 'Jan_Fev_Mar_Avr_Mai_Gün_Jul_Gus_Set_Lis_Noe_Zec'.split('_'),
            weekdays: 'Súladi_Lúneçi_Maitzi_Márcuri_Xhúadi_Viénerçi_Sáturi'.split('_'),
            weekdaysShort: 'Súl_Lún_Mai_Már_Xhú_Vié_Sát'.split('_'),
            weekdaysMin: 'Sú_Lú_Ma_Má_Xh_Vi_Sá'.split('_'),
            longDateFormat: { LT: 'HH.mm', LTS: 'HH.mm.ss', L: 'DD.MM.YYYY', LL: 'D. MMMM [dallas] YYYY', LLL: 'D. MMMM [dallas] YYYY HH.mm', LLLL: 'dddd, [li] D. MMMM [dallas] YYYY HH.mm' },
            meridiemParse: /d\'o|d\'a/i,
            isPM: function (e) {
              return "d'o" === e.toLowerCase();
            },
            meridiem: function (e, a, t) {
              return 11 < e ? (t ? "d'o" : "D'O") : t ? "d'a" : "D'A";
            },
            calendar: { sameDay: '[oxhi à] LT', nextDay: '[demà à] LT', nextWeek: 'dddd [à] LT', lastDay: '[ieiri à] LT', lastWeek: '[sür el] dddd [lasteu à] LT', sameElse: 'L' },
            relativeTime: { future: 'osprei %s', past: 'ja%s', s: Ed, ss: Ed, m: Ed, mm: Ed, h: Ed, hh: Ed, d: Ed, dd: Ed, M: Ed, MM: Ed, y: Ed, yy: Ed },
            dayOfMonthOrdinalParse: /\d{1,2}\./,
            ordinal: '%d.',
            week: { dow: 1, doy: 4 },
          }),
          t.defineLocale('tzm-latn', {
            months: 'innayr_brˤayrˤ_marˤsˤ_ibrir_mayyw_ywnyw_ywlywz_ɣwšt_šwtanbir_ktˤwbrˤ_nwwanbir_dwjnbir'.split('_'),
            monthsShort: 'innayr_brˤayrˤ_marˤsˤ_ibrir_mayyw_ywnyw_ywlywz_ɣwšt_šwtanbir_ktˤwbrˤ_nwwanbir_dwjnbir'.split('_'),
            weekdays: 'asamas_aynas_asinas_akras_akwas_asimwas_asiḍyas'.split('_'),
            weekdaysShort: 'asamas_aynas_asinas_akras_akwas_asimwas_asiḍyas'.split('_'),
            weekdaysMin: 'asamas_aynas_asinas_akras_akwas_asimwas_asiḍyas'.split('_'),
            longDateFormat: { LT: 'HH:mm', LTS: 'HH:mm:ss', L: 'DD/MM/YYYY', LL: 'D MMMM YYYY', LLL: 'D MMMM YYYY HH:mm', LLLL: 'dddd D MMMM YYYY HH:mm' },
            calendar: { sameDay: '[asdkh g] LT', nextDay: '[aska g] LT', nextWeek: 'dddd [g] LT', lastDay: '[assant g] LT', lastWeek: 'dddd [g] LT', sameElse: 'L' },
            relativeTime: { future: 'dadkh s yan %s', past: 'yan %s', s: 'imik', ss: '%d imik', m: 'minuḍ', mm: '%d minuḍ', h: 'saɛa', hh: '%d tassaɛin', d: 'ass', dd: '%d ossan', M: 'ayowr', MM: '%d iyyirn', y: 'asgas', yy: '%d isgasn' },
            week: { dow: 6, doy: 12 },
          }),
          t.defineLocale('tzm', {
            months: 'ⵉⵏⵏⴰⵢⵔ_ⴱⵕⴰⵢⵕ_ⵎⴰⵕⵚ_ⵉⴱⵔⵉⵔ_ⵎⴰⵢⵢⵓ_ⵢⵓⵏⵢⵓ_ⵢⵓⵍⵢⵓⵣ_ⵖⵓⵛⵜ_ⵛⵓⵜⴰⵏⴱⵉⵔ_ⴽⵟⵓⴱⵕ_ⵏⵓⵡⴰⵏⴱⵉⵔ_ⴷⵓⵊⵏⴱⵉⵔ'.split('_'),
            monthsShort: 'ⵉⵏⵏⴰⵢⵔ_ⴱⵕⴰⵢⵕ_ⵎⴰⵕⵚ_ⵉⴱⵔⵉⵔ_ⵎⴰⵢⵢⵓ_ⵢⵓⵏⵢⵓ_ⵢⵓⵍⵢⵓⵣ_ⵖⵓⵛⵜ_ⵛⵓⵜⴰⵏⴱⵉⵔ_ⴽⵟⵓⴱⵕ_ⵏⵓⵡⴰⵏⴱⵉⵔ_ⴷⵓⵊⵏⴱⵉⵔ'.split('_'),
            weekdays: 'ⴰⵙⴰⵎⴰⵙ_ⴰⵢⵏⴰⵙ_ⴰⵙⵉⵏⴰⵙ_ⴰⴽⵔⴰⵙ_ⴰⴽⵡⴰⵙ_ⴰⵙⵉⵎⵡⴰⵙ_ⴰⵙⵉⴹⵢⴰⵙ'.split('_'),
            weekdaysShort: 'ⴰⵙⴰⵎⴰⵙ_ⴰⵢⵏⴰⵙ_ⴰⵙⵉⵏⴰⵙ_ⴰⴽⵔⴰⵙ_ⴰⴽⵡⴰⵙ_ⴰⵙⵉⵎⵡⴰⵙ_ⴰⵙⵉⴹⵢⴰⵙ'.split('_'),
            weekdaysMin: 'ⴰⵙⴰⵎⴰⵙ_ⴰⵢⵏⴰⵙ_ⴰⵙⵉⵏⴰⵙ_ⴰⴽⵔⴰⵙ_ⴰⴽⵡⴰⵙ_ⴰⵙⵉⵎⵡⴰⵙ_ⴰⵙⵉⴹⵢⴰⵙ'.split('_'),
            longDateFormat: { LT: 'HH:mm', LTS: 'HH:mm:ss', L: 'DD/MM/YYYY', LL: 'D MMMM YYYY', LLL: 'D MMMM YYYY HH:mm', LLLL: 'dddd D MMMM YYYY HH:mm' },
            calendar: { sameDay: '[ⴰⵙⴷⵅ ⴴ] LT', nextDay: '[ⴰⵙⴽⴰ ⴴ] LT', nextWeek: 'dddd [ⴴ] LT', lastDay: '[ⴰⵚⴰⵏⵜ ⴴ] LT', lastWeek: 'dddd [ⴴ] LT', sameElse: 'L' },
            relativeTime: { future: 'ⴷⴰⴷⵅ ⵙ ⵢⴰⵏ %s', past: 'ⵢⴰⵏ %s', s: 'ⵉⵎⵉⴽ', ss: '%d ⵉⵎⵉⴽ', m: 'ⵎⵉⵏⵓⴺ', mm: '%d ⵎⵉⵏⵓⴺ', h: 'ⵙⴰⵄⴰ', hh: '%d ⵜⴰⵙⵙⴰⵄⵉⵏ', d: 'ⴰⵙⵙ', dd: '%d oⵙⵙⴰⵏ', M: 'ⴰⵢoⵓⵔ', MM: '%d ⵉⵢⵢⵉⵔⵏ', y: 'ⴰⵙⴳⴰⵙ', yy: '%d ⵉⵙⴳⴰⵙⵏ' },
            week: { dow: 6, doy: 12 },
          }),
          t.defineLocale('ug-cn', {
            months: 'يانۋار_فېۋرال_مارت_ئاپرېل_ماي_ئىيۇن_ئىيۇل_ئاۋغۇست_سېنتەبىر_ئۆكتەبىر_نويابىر_دېكابىر'.split('_'),
            monthsShort: 'يانۋار_فېۋرال_مارت_ئاپرېل_ماي_ئىيۇن_ئىيۇل_ئاۋغۇست_سېنتەبىر_ئۆكتەبىر_نويابىر_دېكابىر'.split('_'),
            weekdays: 'يەكشەنبە_دۈشەنبە_سەيشەنبە_چارشەنبە_پەيشەنبە_جۈمە_شەنبە'.split('_'),
            weekdaysShort: 'يە_دۈ_سە_چا_پە_جۈ_شە'.split('_'),
            weekdaysMin: 'يە_دۈ_سە_چا_پە_جۈ_شە'.split('_'),
            longDateFormat: { LT: 'HH:mm', LTS: 'HH:mm:ss', L: 'YYYY-MM-DD', LL: 'YYYY-يىلىM-ئاينىڭD-كۈنى', LLL: 'YYYY-يىلىM-ئاينىڭD-كۈنى، HH:mm', LLLL: 'dddd، YYYY-يىلىM-ئاينىڭD-كۈنى، HH:mm' },
            meridiemParse: /\u064a\u06d0\u0631\u0649\u0645 \u0643\u06d0\u0686\u06d5|\u0633\u06d5\u06be\u06d5\u0631|\u0686\u06c8\u0634\u062a\u0649\u0646 \u0628\u06c7\u0631\u06c7\u0646|\u0686\u06c8\u0634|\u0686\u06c8\u0634\u062a\u0649\u0646 \u0643\u06d0\u064a\u0649\u0646|\u0643\u06d5\u0686/,
            meridiemHour: function (e, a) {
              return 12 === e && (e = 0), 'يېرىم كېچە' === a || 'سەھەر' === a || 'چۈشتىن بۇرۇن' === a || ('چۈشتىن كېيىن' !== a && 'كەچ' !== a && 11 <= e) ? e : e + 12;
            },
            meridiem: function (e, a, t) {
              var s = 100 * e + a;
              return s < 600 ? 'يېرىم كېچە' : s < 900 ? 'سەھەر' : s < 1130 ? 'چۈشتىن بۇرۇن' : s < 1230 ? 'چۈش' : s < 1800 ? 'چۈشتىن كېيىن' : 'كەچ';
            },
            calendar: { sameDay: '[بۈگۈن سائەت] LT', nextDay: '[ئەتە سائەت] LT', nextWeek: '[كېلەركى] dddd [سائەت] LT', lastDay: '[تۆنۈگۈن] LT', lastWeek: '[ئالدىنقى] dddd [سائەت] LT', sameElse: 'L' },
            relativeTime: { future: '%s كېيىن', past: '%s بۇرۇن', s: 'نەچچە سېكونت', ss: '%d سېكونت', m: 'بىر مىنۇت', mm: '%d مىنۇت', h: 'بىر سائەت', hh: '%d سائەت', d: 'بىر كۈن', dd: '%d كۈن', M: 'بىر ئاي', MM: '%d ئاي', y: 'بىر يىل', yy: '%d يىل' },
            dayOfMonthOrdinalParse: /\d{1,2}(-\u0643\u06c8\u0646\u0649|-\u0626\u0627\u064a|-\u06be\u06d5\u067e\u062a\u06d5)/,
            ordinal: function (e, a) {
              switch (a) {
                case 'd':
                case 'D':
                case 'DDD':
                  return e + '-كۈنى';
                case 'w':
                case 'W':
                  return e + '-ھەپتە';
                default:
                  return e;
              }
            },
            preparse: function (e) {
              return e.replace(/\u060c/g, ',');
            },
            postformat: function (e) {
              return e.replace(/,/g, '،');
            },
            week: { dow: 1, doy: 7 },
          }),
          t.defineLocale('uk', {
            months: { format: 'січня_лютого_березня_квітня_травня_червня_липня_серпня_вересня_жовтня_листопада_грудня'.split('_'), standalone: 'січень_лютий_березень_квітень_травень_червень_липень_серпень_вересень_жовтень_листопад_грудень'.split('_') },
            monthsShort: 'січ_лют_бер_квіт_трав_черв_лип_серп_вер_жовт_лист_груд'.split('_'),
            weekdays: function (e, a) {
              var t = { nominative: 'неділя_понеділок_вівторок_середа_четвер_п’ятниця_субота'.split('_'), accusative: 'неділю_понеділок_вівторок_середу_четвер_п’ятницю_суботу'.split('_'), genitive: 'неділі_понеділка_вівторка_середи_четверга_п’ятниці_суботи'.split('_') };
              return !0 === e
                ? t.nominative.slice(1, 7).concat(t.nominative.slice(0, 1))
                : e
                ? t[/(\[[\u0412\u0432\u0423\u0443]\]) ?dddd/.test(a) ? 'accusative' : /\[?(?:\u043c\u0438\u043d\u0443\u043b\u043e\u0457|\u043d\u0430\u0441\u0442\u0443\u043f\u043d\u043e\u0457)? ?\] ?dddd/.test(a) ? 'genitive' : 'nominative'][e.day()]
                : t.nominative;
            },
            weekdaysShort: 'нд_пн_вт_ср_чт_пт_сб'.split('_'),
            weekdaysMin: 'нд_пн_вт_ср_чт_пт_сб'.split('_'),
            longDateFormat: { LT: 'HH:mm', LTS: 'HH:mm:ss', L: 'DD.MM.YYYY', LL: 'D MMMM YYYY р.', LLL: 'D MMMM YYYY р., HH:mm', LLLL: 'dddd, D MMMM YYYY р., HH:mm' },
            calendar: {
              sameDay: zd('[Сьогодні '),
              nextDay: zd('[Завтра '),
              lastDay: zd('[Вчора '),
              nextWeek: zd('[У] dddd ['),
              lastWeek: function () {
                switch (this.day()) {
                  case 0:
                  case 3:
                  case 5:
                  case 6:
                    return zd('[Минулої] dddd [').call(this);
                  case 1:
                  case 2:
                  case 4:
                    return zd('[Минулого] dddd [').call(this);
                }
              },
              sameElse: 'L',
            },
            relativeTime: { future: 'за %s', past: '%s тому', s: 'декілька секунд', ss: Fd, m: Fd, mm: Fd, h: 'годину', hh: Fd, d: 'день', dd: Fd, M: 'місяць', MM: Fd, y: 'рік', yy: Fd },
            meridiemParse: /\u043d\u043e\u0447\u0456|\u0440\u0430\u043d\u043a\u0443|\u0434\u043d\u044f|\u0432\u0435\u0447\u043e\u0440\u0430/,
            isPM: function (e) {
              return /^(\u0434\u043d\u044f|\u0432\u0435\u0447\u043e\u0440\u0430)$/.test(e);
            },
            meridiem: function (e, a, t) {
              return e < 4 ? 'ночі' : e < 12 ? 'ранку' : e < 17 ? 'дня' : 'вечора';
            },
            dayOfMonthOrdinalParse: /\d{1,2}-(\u0439|\u0433\u043e)/,
            ordinal: function (e, a) {
              switch (a) {
                case 'M':
                case 'd':
                case 'DDD':
                case 'w':
                case 'W':
                  return e + '-й';
                case 'D':
                  return e + '-го';
                default:
                  return e;
              }
            },
            week: { dow: 1, doy: 7 },
          });
        var Nd = ['جنوری', 'فروری', 'مارچ', 'اپریل', 'مئی', 'جون', 'جولائی', 'اگست', 'ستمبر', 'اکتوبر', 'نومبر', 'دسمبر'],
          Jd = ['اتوار', 'پیر', 'منگل', 'بدھ', 'جمعرات', 'جمعہ', 'ہفتہ'];
        return (
          t.defineLocale('ur', {
            months: Nd,
            monthsShort: Nd,
            weekdays: Jd,
            weekdaysShort: Jd,
            weekdaysMin: Jd,
            longDateFormat: { LT: 'HH:mm', LTS: 'HH:mm:ss', L: 'DD/MM/YYYY', LL: 'D MMMM YYYY', LLL: 'D MMMM YYYY HH:mm', LLLL: 'dddd، D MMMM YYYY HH:mm' },
            meridiemParse: /\u0635\u0628\u062d|\u0634\u0627\u0645/,
            isPM: function (e) {
              return 'شام' === e;
            },
            meridiem: function (e, a, t) {
              return e < 12 ? 'صبح' : 'شام';
            },
            calendar: { sameDay: '[آج بوقت] LT', nextDay: '[کل بوقت] LT', nextWeek: 'dddd [بوقت] LT', lastDay: '[گذشتہ روز بوقت] LT', lastWeek: '[گذشتہ] dddd [بوقت] LT', sameElse: 'L' },
            relativeTime: { future: '%s بعد', past: '%s قبل', s: 'چند سیکنڈ', ss: '%d سیکنڈ', m: 'ایک منٹ', mm: '%d منٹ', h: 'ایک گھنٹہ', hh: '%d گھنٹے', d: 'ایک دن', dd: '%d دن', M: 'ایک ماہ', MM: '%d ماہ', y: 'ایک سال', yy: '%d سال' },
            preparse: function (e) {
              return e.replace(/\u060c/g, ',');
            },
            postformat: function (e) {
              return e.replace(/,/g, '،');
            },
            week: { dow: 1, doy: 4 },
          }),
          t.defineLocale('uz-latn', {
            months: 'Yanvar_Fevral_Mart_Aprel_May_Iyun_Iyul_Avgust_Sentabr_Oktabr_Noyabr_Dekabr'.split('_'),
            monthsShort: 'Yan_Fev_Mar_Apr_May_Iyun_Iyul_Avg_Sen_Okt_Noy_Dek'.split('_'),
            weekdays: 'Yakshanba_Dushanba_Seshanba_Chorshanba_Payshanba_Juma_Shanba'.split('_'),
            weekdaysShort: 'Yak_Dush_Sesh_Chor_Pay_Jum_Shan'.split('_'),
            weekdaysMin: 'Ya_Du_Se_Cho_Pa_Ju_Sha'.split('_'),
            longDateFormat: { LT: 'HH:mm', LTS: 'HH:mm:ss', L: 'DD/MM/YYYY', LL: 'D MMMM YYYY', LLL: 'D MMMM YYYY HH:mm', LLLL: 'D MMMM YYYY, dddd HH:mm' },
            calendar: { sameDay: '[Bugun soat] LT [da]', nextDay: '[Ertaga] LT [da]', nextWeek: 'dddd [kuni soat] LT [da]', lastDay: '[Kecha soat] LT [da]', lastWeek: "[O'tgan] dddd [kuni soat] LT [da]", sameElse: 'L' },
            relativeTime: { future: 'Yaqin %s ichida', past: 'Bir necha %s oldin', s: 'soniya', ss: '%d soniya', m: 'bir daqiqa', mm: '%d daqiqa', h: 'bir soat', hh: '%d soat', d: 'bir kun', dd: '%d kun', M: 'bir oy', MM: '%d oy', y: 'bir yil', yy: '%d yil' },
            week: { dow: 1, doy: 7 },
          }),
          t.defineLocale('uz', {
            months: 'январ_феврал_март_апрел_май_июн_июл_август_сентябр_октябр_ноябр_декабр'.split('_'),
            monthsShort: 'янв_фев_мар_апр_май_июн_июл_авг_сен_окт_ноя_дек'.split('_'),
            weekdays: 'Якшанба_Душанба_Сешанба_Чоршанба_Пайшанба_Жума_Шанба'.split('_'),
            weekdaysShort: 'Якш_Душ_Сеш_Чор_Пай_Жум_Шан'.split('_'),
            weekdaysMin: 'Як_Ду_Се_Чо_Па_Жу_Ша'.split('_'),
            longDateFormat: { LT: 'HH:mm', LTS: 'HH:mm:ss', L: 'DD/MM/YYYY', LL: 'D MMMM YYYY', LLL: 'D MMMM YYYY HH:mm', LLLL: 'D MMMM YYYY, dddd HH:mm' },
            calendar: { sameDay: '[Бугун соат] LT [да]', nextDay: '[Эртага] LT [да]', nextWeek: 'dddd [куни соат] LT [да]', lastDay: '[Кеча соат] LT [да]', lastWeek: '[Утган] dddd [куни соат] LT [да]', sameElse: 'L' },
            relativeTime: { future: 'Якин %s ичида', past: 'Бир неча %s олдин', s: 'фурсат', ss: '%d фурсат', m: 'бир дакика', mm: '%d дакика', h: 'бир соат', hh: '%d соат', d: 'бир кун', dd: '%d кун', M: 'бир ой', MM: '%d ой', y: 'бир йил', yy: '%d йил' },
            week: { dow: 1, doy: 7 },
          }),
          t.defineLocale('vi', {
            months: 'tháng 1_tháng 2_tháng 3_tháng 4_tháng 5_tháng 6_tháng 7_tháng 8_tháng 9_tháng 10_tháng 11_tháng 12'.split('_'),
            monthsShort: 'Thg 01_Thg 02_Thg 03_Thg 04_Thg 05_Thg 06_Thg 07_Thg 08_Thg 09_Thg 10_Thg 11_Thg 12'.split('_'),
            monthsParseExact: !0,
            weekdays: 'chủ nhật_thứ hai_thứ ba_thứ tư_thứ năm_thứ sáu_thứ bảy'.split('_'),
            weekdaysShort: 'CN_T2_T3_T4_T5_T6_T7'.split('_'),
            weekdaysMin: 'CN_T2_T3_T4_T5_T6_T7'.split('_'),
            weekdaysParseExact: !0,
            meridiemParse: /sa|ch/i,
            isPM: function (e) {
              return /^ch$/i.test(e);
            },
            meridiem: function (e, a, t) {
              return e < 12 ? (t ? 'sa' : 'SA') : t ? 'ch' : 'CH';
            },
            longDateFormat: { LT: 'HH:mm', LTS: 'HH:mm:ss', L: 'DD/MM/YYYY', LL: 'D MMMM [năm] YYYY', LLL: 'D MMMM [năm] YYYY HH:mm', LLLL: 'dddd, D MMMM [năm] YYYY HH:mm', l: 'DD/M/YYYY', ll: 'D MMM YYYY', lll: 'D MMM YYYY HH:mm', llll: 'ddd, D MMM YYYY HH:mm' },
            calendar: { sameDay: '[Hôm nay lúc] LT', nextDay: '[Ngày mai lúc] LT', nextWeek: 'dddd [tuần tới lúc] LT', lastDay: '[Hôm qua lúc] LT', lastWeek: 'dddd [tuần trước lúc] LT', sameElse: 'L' },
            relativeTime: { future: '%s tới', past: '%s trước', s: 'vài giây', ss: '%d giây', m: 'một phút', mm: '%d phút', h: 'một giờ', hh: '%d giờ', d: 'một ngày', dd: '%d ngày', w: 'một tuần', ww: '%d tuần', M: 'một tháng', MM: '%d tháng', y: 'một năm', yy: '%d năm' },
            dayOfMonthOrdinalParse: /\d{1,2}/,
            ordinal: function (e) {
              return e;
            },
            week: { dow: 1, doy: 4 },
          }),
          t.defineLocale('x-pseudo', {
            months: 'J~áñúá~rý_F~ébrú~árý_~Márc~h_Áp~ríl_~Máý_~Júñé~_Júl~ý_Áú~gúst~_Sép~témb~ér_Ó~ctób~ér_Ñ~óvém~bér_~Décé~mbér'.split('_'),
            monthsShort: 'J~áñ_~Féb_~Már_~Ápr_~Máý_~Júñ_~Júl_~Áúg_~Sép_~Óct_~Ñóv_~Déc'.split('_'),
            monthsParseExact: !0,
            weekdays: 'S~úñdá~ý_Mó~ñdáý~_Túé~sdáý~_Wéd~ñésd~áý_T~húrs~dáý_~Fríd~áý_S~átúr~dáý'.split('_'),
            weekdaysShort: 'S~úñ_~Móñ_~Túé_~Wéd_~Thú_~Frí_~Sát'.split('_'),
            weekdaysMin: 'S~ú_Mó~_Tú_~Wé_T~h_Fr~_Sá'.split('_'),
            weekdaysParseExact: !0,
            longDateFormat: { LT: 'HH:mm', L: 'DD/MM/YYYY', LL: 'D MMMM YYYY', LLL: 'D MMMM YYYY HH:mm', LLLL: 'dddd, D MMMM YYYY HH:mm' },
            calendar: { sameDay: '[T~ódá~ý át] LT', nextDay: '[T~ómó~rró~w át] LT', nextWeek: 'dddd [át] LT', lastDay: '[Ý~ést~érdá~ý át] LT', lastWeek: '[L~ást] dddd [át] LT', sameElse: 'L' },
            relativeTime: { future: 'í~ñ %s', past: '%s á~gó', s: 'á ~féw ~sécó~ñds', ss: '%d s~écóñ~ds', m: 'á ~míñ~úté', mm: '%d m~íñú~tés', h: 'á~ñ hó~úr', hh: '%d h~óúrs', d: 'á ~dáý', dd: '%d d~áýs', M: 'á ~móñ~th', MM: '%d m~óñt~hs', y: 'á ~ýéár', yy: '%d ý~éárs' },
            dayOfMonthOrdinalParse: /\d{1,2}(th|st|nd|rd)/,
            ordinal: function (e) {
              var a = e % 10;
              return e + (1 == ~~((e % 100) / 10) ? 'th' : 1 == a ? 'st' : 2 == a ? 'nd' : 3 == a ? 'rd' : 'th');
            },
            week: { dow: 1, doy: 4 },
          }),
          t.defineLocale('yo', {
            months: 'Sẹ́rẹ́_Èrèlè_Ẹrẹ̀nà_Ìgbé_Èbibi_Òkùdu_Agẹmo_Ògún_Owewe_Ọ̀wàrà_Bélú_Ọ̀pẹ̀̀'.split('_'),
            monthsShort: 'Sẹ́r_Èrl_Ẹrn_Ìgb_Èbi_Òkù_Agẹ_Ògú_Owe_Ọ̀wà_Bél_Ọ̀pẹ̀̀'.split('_'),
            weekdays: 'Àìkú_Ajé_Ìsẹ́gun_Ọjọ́rú_Ọjọ́bọ_Ẹtì_Àbámẹ́ta'.split('_'),
            weekdaysShort: 'Àìk_Ajé_Ìsẹ́_Ọjr_Ọjb_Ẹtì_Àbá'.split('_'),
            weekdaysMin: 'Àì_Aj_Ìs_Ọr_Ọb_Ẹt_Àb'.split('_'),
            longDateFormat: { LT: 'h:mm A', LTS: 'h:mm:ss A', L: 'DD/MM/YYYY', LL: 'D MMMM YYYY', LLL: 'D MMMM YYYY h:mm A', LLLL: 'dddd, D MMMM YYYY h:mm A' },
            calendar: { sameDay: '[Ònì ni] LT', nextDay: '[Ọ̀la ni] LT', nextWeek: "dddd [Ọsẹ̀ tón'bọ] [ni] LT", lastDay: '[Àna ni] LT', lastWeek: 'dddd [Ọsẹ̀ tólọ́] [ni] LT', sameElse: 'L' },
            relativeTime: { future: 'ní %s', past: '%s kọjá', s: 'ìsẹjú aayá die', ss: 'aayá %d', m: 'ìsẹjú kan', mm: 'ìsẹjú %d', h: 'wákati kan', hh: 'wákati %d', d: 'ọjọ́ kan', dd: 'ọjọ́ %d', M: 'osù kan', MM: 'osù %d', y: 'ọdún kan', yy: 'ọdún %d' },
            dayOfMonthOrdinalParse: /\u1ecdj\u1ecd\u0301\s\d{1,2}/,
            ordinal: 'ọjọ́ %d',
            week: { dow: 1, doy: 4 },
          }),
          t.defineLocale('zh-cn', {
            months: '一月_二月_三月_四月_五月_六月_七月_八月_九月_十月_十一月_十二月'.split('_'),
            monthsShort: '1月_2月_3月_4月_5月_6月_7月_8月_9月_10月_11月_12月'.split('_'),
            weekdays: '星期日_星期一_星期二_星期三_星期四_星期五_星期六'.split('_'),
            weekdaysShort: '周日_周一_周二_周三_周四_周五_周六'.split('_'),
            weekdaysMin: '日_一_二_三_四_五_六'.split('_'),
            longDateFormat: { LT: 'HH:mm', LTS: 'HH:mm:ss', L: 'YYYY/MM/DD', LL: 'YYYY年M月D日', LLL: 'YYYY年M月D日Ah点mm分', LLLL: 'YYYY年M月D日ddddAh点mm分', l: 'YYYY/M/D', ll: 'YYYY年M月D日', lll: 'YYYY年M月D日 HH:mm', llll: 'YYYY年M月D日dddd HH:mm' },
            meridiemParse: /\u51cc\u6668|\u65e9\u4e0a|\u4e0a\u5348|\u4e2d\u5348|\u4e0b\u5348|\u665a\u4e0a/,
            meridiemHour: function (e, a) {
              return 12 === e && (e = 0), '凌晨' === a || '早上' === a || '上午' === a || ('下午' !== a && '晚上' !== a && 11 <= e) ? e : e + 12;
            },
            meridiem: function (e, a, t) {
              var s = 100 * e + a;
              return s < 600 ? '凌晨' : s < 900 ? '早上' : s < 1130 ? '上午' : s < 1230 ? '中午' : s < 1800 ? '下午' : '晚上';
            },
            calendar: {
              sameDay: '[今天]LT',
              nextDay: '[明天]LT',
              nextWeek: function (e) {
                return e.week() !== this.week() ? '[下]dddLT' : '[本]dddLT';
              },
              lastDay: '[昨天]LT',
              lastWeek: function (e) {
                return this.week() !== e.week() ? '[上]dddLT' : '[本]dddLT';
              },
              sameElse: 'L',
            },
            dayOfMonthOrdinalParse: /\d{1,2}(\u65e5|\u6708|\u5468)/,
            ordinal: function (e, a) {
              switch (a) {
                case 'd':
                case 'D':
                case 'DDD':
                  return e + '日';
                case 'M':
                  return e + '月';
                case 'w':
                case 'W':
                  return e + '周';
                default:
                  return e;
              }
            },
            relativeTime: { future: '%s后', past: '%s前', s: '几秒', ss: '%d 秒', m: '1 分钟', mm: '%d 分钟', h: '1 小时', hh: '%d 小时', d: '1 天', dd: '%d 天', w: '1 周', ww: '%d 周', M: '1 个月', MM: '%d 个月', y: '1 年', yy: '%d 年' },
            week: { dow: 1, doy: 4 },
          }),
          t.defineLocale('zh-hk', {
            months: '一月_二月_三月_四月_五月_六月_七月_八月_九月_十月_十一月_十二月'.split('_'),
            monthsShort: '1月_2月_3月_4月_5月_6月_7月_8月_9月_10月_11月_12月'.split('_'),
            weekdays: '星期日_星期一_星期二_星期三_星期四_星期五_星期六'.split('_'),
            weekdaysShort: '週日_週一_週二_週三_週四_週五_週六'.split('_'),
            weekdaysMin: '日_一_二_三_四_五_六'.split('_'),
            longDateFormat: { LT: 'HH:mm', LTS: 'HH:mm:ss', L: 'YYYY/MM/DD', LL: 'YYYY年M月D日', LLL: 'YYYY年M月D日 HH:mm', LLLL: 'YYYY年M月D日dddd HH:mm', l: 'YYYY/M/D', ll: 'YYYY年M月D日', lll: 'YYYY年M月D日 HH:mm', llll: 'YYYY年M月D日dddd HH:mm' },
            meridiemParse: /\u51cc\u6668|\u65e9\u4e0a|\u4e0a\u5348|\u4e2d\u5348|\u4e0b\u5348|\u665a\u4e0a/,
            meridiemHour: function (e, a) {
              return 12 === e && (e = 0), '凌晨' === a || '早上' === a || '上午' === a ? e : '中午' === a ? (11 <= e ? e : e + 12) : '下午' === a || '晚上' === a ? e + 12 : void 0;
            },
            meridiem: function (e, a, t) {
              var s = 100 * e + a;
              return s < 600 ? '凌晨' : s < 900 ? '早上' : s < 1200 ? '上午' : 1200 === s ? '中午' : s < 1800 ? '下午' : '晚上';
            },
            calendar: { sameDay: '[今天]LT', nextDay: '[明天]LT', nextWeek: '[下]ddddLT', lastDay: '[昨天]LT', lastWeek: '[上]ddddLT', sameElse: 'L' },
            dayOfMonthOrdinalParse: /\d{1,2}(\u65e5|\u6708|\u9031)/,
            ordinal: function (e, a) {
              switch (a) {
                case 'd':
                case 'D':
                case 'DDD':
                  return e + '日';
                case 'M':
                  return e + '月';
                case 'w':
                case 'W':
                  return e + '週';
                default:
                  return e;
              }
            },
            relativeTime: { future: '%s後', past: '%s前', s: '幾秒', ss: '%d 秒', m: '1 分鐘', mm: '%d 分鐘', h: '1 小時', hh: '%d 小時', d: '1 天', dd: '%d 天', M: '1 個月', MM: '%d 個月', y: '1 年', yy: '%d 年' },
          }),
          t.defineLocale('zh-mo', {
            months: '一月_二月_三月_四月_五月_六月_七月_八月_九月_十月_十一月_十二月'.split('_'),
            monthsShort: '1月_2月_3月_4月_5月_6月_7月_8月_9月_10月_11月_12月'.split('_'),
            weekdays: '星期日_星期一_星期二_星期三_星期四_星期五_星期六'.split('_'),
            weekdaysShort: '週日_週一_週二_週三_週四_週五_週六'.split('_'),
            weekdaysMin: '日_一_二_三_四_五_六'.split('_'),
            longDateFormat: { LT: 'HH:mm', LTS: 'HH:mm:ss', L: 'DD/MM/YYYY', LL: 'YYYY年M月D日', LLL: 'YYYY年M月D日 HH:mm', LLLL: 'YYYY年M月D日dddd HH:mm', l: 'D/M/YYYY', ll: 'YYYY年M月D日', lll: 'YYYY年M月D日 HH:mm', llll: 'YYYY年M月D日dddd HH:mm' },
            meridiemParse: /\u51cc\u6668|\u65e9\u4e0a|\u4e0a\u5348|\u4e2d\u5348|\u4e0b\u5348|\u665a\u4e0a/,
            meridiemHour: function (e, a) {
              return 12 === e && (e = 0), '凌晨' === a || '早上' === a || '上午' === a ? e : '中午' === a ? (11 <= e ? e : e + 12) : '下午' === a || '晚上' === a ? e + 12 : void 0;
            },
            meridiem: function (e, a, t) {
              var s = 100 * e + a;
              return s < 600 ? '凌晨' : s < 900 ? '早上' : s < 1130 ? '上午' : s < 1230 ? '中午' : s < 1800 ? '下午' : '晚上';
            },
            calendar: { sameDay: '[今天] LT', nextDay: '[明天] LT', nextWeek: '[下]dddd LT', lastDay: '[昨天] LT', lastWeek: '[上]dddd LT', sameElse: 'L' },
            dayOfMonthOrdinalParse: /\d{1,2}(\u65e5|\u6708|\u9031)/,
            ordinal: function (e, a) {
              switch (a) {
                case 'd':
                case 'D':
                case 'DDD':
                  return e + '日';
                case 'M':
                  return e + '月';
                case 'w':
                case 'W':
                  return e + '週';
                default:
                  return e;
              }
            },
            relativeTime: { future: '%s內', past: '%s前', s: '幾秒', ss: '%d 秒', m: '1 分鐘', mm: '%d 分鐘', h: '1 小時', hh: '%d 小時', d: '1 天', dd: '%d 天', M: '1 個月', MM: '%d 個月', y: '1 年', yy: '%d 年' },
          }),
          t.defineLocale('zh-tw', {
            months: '一月_二月_三月_四月_五月_六月_七月_八月_九月_十月_十一月_十二月'.split('_'),
            monthsShort: '1月_2月_3月_4月_5月_6月_7月_8月_9月_10月_11月_12月'.split('_'),
            weekdays: '星期日_星期一_星期二_星期三_星期四_星期五_星期六'.split('_'),
            weekdaysShort: '週日_週一_週二_週三_週四_週五_週六'.split('_'),
            weekdaysMin: '日_一_二_三_四_五_六'.split('_'),
            longDateFormat: { LT: 'HH:mm', LTS: 'HH:mm:ss', L: 'YYYY/MM/DD', LL: 'YYYY年M月D日', LLL: 'YYYY年M月D日 HH:mm', LLLL: 'YYYY年M月D日dddd HH:mm', l: 'YYYY/M/D', ll: 'YYYY年M月D日', lll: 'YYYY年M月D日 HH:mm', llll: 'YYYY年M月D日dddd HH:mm' },
            meridiemParse: /\u51cc\u6668|\u65e9\u4e0a|\u4e0a\u5348|\u4e2d\u5348|\u4e0b\u5348|\u665a\u4e0a/,
            meridiemHour: function (e, a) {
              return 12 === e && (e = 0), '凌晨' === a || '早上' === a || '上午' === a ? e : '中午' === a ? (11 <= e ? e : e + 12) : '下午' === a || '晚上' === a ? e + 12 : void 0;
            },
            meridiem: function (e, a, t) {
              var s = 100 * e + a;
              return s < 600 ? '凌晨' : s < 900 ? '早上' : s < 1130 ? '上午' : s < 1230 ? '中午' : s < 1800 ? '下午' : '晚上';
            },
            calendar: { sameDay: '[今天] LT', nextDay: '[明天] LT', nextWeek: '[下]dddd LT', lastDay: '[昨天] LT', lastWeek: '[上]dddd LT', sameElse: 'L' },
            dayOfMonthOrdinalParse: /\d{1,2}(\u65e5|\u6708|\u9031)/,
            ordinal: function (e, a) {
              switch (a) {
                case 'd':
                case 'D':
                case 'DDD':
                  return e + '日';
                case 'M':
                  return e + '月';
                case 'w':
                case 'W':
                  return e + '週';
                default:
                  return e;
              }
            },
            relativeTime: { future: '%s後', past: '%s前', s: '幾秒', ss: '%d 秒', m: '1 分鐘', mm: '%d 分鐘', h: '1 小時', hh: '%d 小時', d: '1 天', dd: '%d 天', M: '1 個月', MM: '%d 個月', y: '1 年', yy: '%d 年' },
          }),
          t.locale('en'),
          t
        );
      });
    },
    'sap/ui/yesco/localService/mockserver.js': function () {
      sap.ui.define(['sap/ui/core/util/MockServer', 'sap/ui/model/json/JSONModel', 'sap/base/Log', 'sap/base/util/UriParameters'], (e, t, r, a) => {
        'use strict';
        let o;
        const s = 'sap/ui/yesco/';
        const i = s + 'localService/mockdata';
        const n = {
          init(n = {}) {
            return new Promise((c, u) => {
              const p = sap.ui.require.toUrl(s + 'manifest.json');
              const l = new t(p);
              l.attachRequestCompleted(() => {
                const t = new a(window.location.href);
                const u = sap.ui.require.toUrl(i);
                const p = l.getProperty('/sap.app/dataSources/mainService');
                const d = sap.ui.require.toUrl(s + p.settings.localUri);
                let f = /.*\/$/.test(p.uri) ? p.uri : p.uri + '/';
                f = f && new URI(f).absoluteTo(sap.ui.require.toUrl(s)).toString();
                if (!o) {
                  o = new e({ rootUri: f });
                } else {
                  o.stop();
                }
                e.config({ autoRespond: true, autoRespondAfter: n.delay || t.get('serverDelay') || 500 });
                o.simulate(d, { sMockdataBaseUrl: u, bGenerateMissingMockData: true });
                const m = o.getRequests();
                const g = (e, t, r) => {
                  r.response = (r) => {
                    r.respond(e, { 'Content-Type': 'text/plain;charset=utf-8' }, t);
                  };
                };
                if (n.metadataError || t.get('metadataError')) {
                  m.forEach((e) => {
                    if (e.path.toString().indexOf('$metadata') > -1) {
                      g(500, 'metadata Error', e);
                    }
                  });
                }
                const h = n.errorType || t.get('errorType');
                const q = h === 'badRequest' ? 400 : 500;
                if (h) {
                  m.forEach((e) => {
                    g(q, h, e);
                  });
                }
                o.setRequests(m);
                o.start();
                r.info('Running the app with mock data');
                c();
              });
              l.attachRequestFailed(function () {
                var e = 'Failed to load application manifest';
                r.error(e);
                u(new Error(e));
              });
            });
          },
          getMockServer() {
            return o;
          },
        };
        return n;
      });
    },
    'sap/ui/yesco/manifest.json':
      '{"_version":"1.12.0","sap.app":{"id":"sap.ui.yesco","type":"application","i18n":"i18n/i18n.properties","title":"{{appTitle}}","description":"{{appDescription}}","applicationVersion":{"version":"1.0.0"},"ach":"set-ach","resources":"resources.json","dataSources":{"mainService":{"uri":"/v2/sap/opu/odata/sap/ZHR_COMMON_SRV","type":"OData","settings":{"odataVersion":"2.0","localUri":"localService/metadata.xml"}}}},"sap.fiori":{"registrationIds":[],"archeType":"transactional"},"sap.ui":{"technology":"UI5","icons":{"icon":"sap-icon://detail-view","favIcon":"","phone":"","phone@2":"","tablet":"","tablet@2":""},"deviceTypes":{"desktop":true,"tablet":true,"phone":true}},"sap.ui5":{"rootView":{"viewName":"sap.ui.yesco.view.App","type":"XML","async":true,"id":"app"},"dependencies":{"minUI5Version":"1.66.0","libs":{"sap.ui.core":{},"sap.m":{},"sap.f":{}}},"config":{"commonLocal":"/v2/sap/opu/odata/sap/ZHR_COMMON_SRV","commonRemote":"/sap/opu/odata/sap/ZHR_COMMON_SRV"},"contentDensities":{"compact":true,"cozy":true},"models":{"i18n":{"type":"sap.ui.model.resource.ResourceModel","settings":{"bundleName":"sap.ui.yesco.i18n.i18n","supportedLocales":["ko"],"fallbackLocale":""}}},"resources":{"css":[{"uri":"css/style.css"},{"uri":"css/placeholder.css"}]},"routing":{"config":{"routerClass":"sap.m.routing.Router","viewType":"XML","viewPath":"sap.ui.yesco.view","controlId":"app","controlAggregation":"pages","bypassed":{"target":"notFound"},"async":true},"routes":[{"pattern":"","name":"appHome","target":"home"},{"pattern":"employees","name":"employeeList","target":"employees"}],"targets":{"home":{"viewId":"home","viewName":"Home","viewLevel":1},"employees":{"viewId":"employeeList","viewPath":"sap.ui.yesco.view.employee","viewName":"EmployeeList","viewLevel":2},"notFound":{"viewId":"notFound","viewName":"NotFound","transition":"show"},"object":{"viewName":"Detail","viewId":"detail","viewLevel":1,"controlAggregation":"midColumnPages"},"carousel":{"viewType":"XML","viewName":"Carousel","clearControlAggregation":true,"viewLevel":2},"detailObjectNotFound":{"viewName":"DetailNotFound","viewId":"detailNotFound","controlAggregation":"midColumnPages"}}}}}',
    'sap/ui/yesco/model/Date.js': function () {
      sap.ui.define(['sap/ui/model/type/Date'], (t) => {
        'use strict';
        const e = 'yyyy-MM-dd';
        return {
          today(t = e) {
            return this.format(new Date(), t);
          },
          format(r, n = e, a = e) {
            if (r instanceof Date) {
              const e = new t({ pattern: n });
              return e.formatValue(r, 'string');
            } else if (r instanceof String || typeof r === 'string') {
              const e = new t({ source: { pattern: a }, pattern: n });
              return e.formatValue(r, 'string');
            }
            return '';
          },
          parse(r, n = e) {
            const a = new t({ source: { pattern: n } });
            return a.parseValue(r, 'string');
          },
        };
      });
    },
    'sap/ui/yesco/model/DateTime.js': function () {
      sap.ui.define(['sap/ui/model/type/DateTime'], (t) => {
        'use strict';
        const e = 'yyyy-MM-dd HH:mm:ss';
        return {
          now(t = e) {
            return this.format(new Date(), t);
          },
          format(r, n = e, s = e) {
            if (r instanceof Date) {
              const e = new t({ pattern: n });
              return e.formatValue(r, 'string');
            } else if (r instanceof String || typeof r === 'string') {
              const e = new t({ source: { pattern: s }, pattern: n });
              return e.formatValue(r, 'string');
            }
            return '';
          },
          parse(r, n = e) {
            const s = new t({ source: { pattern: n } });
            return s.parseValue(r, 'string');
          },
        };
      });
    },
    'sap/ui/yesco/model/Time.js': function () {
      sap.ui.define(['sap/ui/model/type/Time'], (t) => {
        'use strict';
        const e = 'HH:mm:ss';
        return {
          now(t = e) {
            return this.format(new Date(), t);
          },
          format(r, n = e, s = e) {
            if (r instanceof Date) {
              const e = new t({ pattern: n });
              return e.formatValue(r, 'string');
            } else if (r instanceof String || typeof r === 'string') {
              const e = new t({ source: { pattern: s }, pattern: n });
              return e.formatValue(r, 'string');
            }
            return '';
          },
          parse(r, n = e) {
            const s = new t({ source: { pattern: n } });
            return s.parseValue(r, 'string');
          },
        };
      });
    },
    'sap/ui/yesco/model/formatter.js': function () {
      sap.ui.define([], () => {
        'use strict';
        return {
          currencyValue(e) {
            if (!e) {
              return '';
            }
            return parseFloat(e).toFixed(2);
          },
        };
      });
    },
    'sap/ui/yesco/model/models.js': function () {
      sap.ui.define(['sap/ui/model/json/JSONModel', 'sap/ui/Device'], (e, i) => {
        'use strict';
        return {
          createDeviceModel() {
            const n = new e(i);
            n.setDefaultBindingMode('OneWay');
            return n;
          },
        };
      });
    },
    'sap/ui/yesco/view/App.view.xml':
      '<mvc:View\r\n\tcontrollerName="sap.ui.yesco.controller.App"\r\n\tdisplayBlock="true"\r\n\theight="100%"\r\n\txmlns="sap.m"\r\n\txmlns:tnt="sap.tnt"\r\n\txmlns:mvc="sap.ui.core.mvc"><tnt:ToolHeader><Button\r\n\t\t\ticon="sap-icon://home"\r\n\t\t\ttype="Transparent"\r\n\t\t\tpress="navigateToHome"><layoutData><OverflowToolbarLayoutData priority="NeverOverflow" /></layoutData></Button><ToolbarSpacer width="20px" /><Button\r\n\t\t\ttext="Home"\r\n\t\t\ttype="Transparent"\r\n\t\t\tid="home"\r\n\t\t\tpress="navigateToHome"><layoutData><OverflowToolbarLayoutData priority="Low" /></layoutData></Button><Button\r\n\t\t\ttext="Carousel"\r\n\t\t\ttype="Transparent"\r\n\t\t\tpress="navigateToCarousel"><layoutData><OverflowToolbarLayoutData priority="Low" /></layoutData></Button><Button\r\n\t\t\ttext="JSON Data"\r\n\t\t\ttype="Transparent"\r\n\t\t\tpress="navigateToUserForm"><layoutData><OverflowToolbarLayoutData priority="Low" /></layoutData></Button><Button\r\n\t\t\ttext="Resource Data"\r\n\t\t\ttype="Transparent"\r\n\t\t\tpress="navigateToAppConfig"><layoutData><OverflowToolbarLayoutData priority="Low" /></layoutData></Button><Button\r\n\t\t\ttext="OData"\r\n\t\t\ttype="Transparent"><layoutData><OverflowToolbarLayoutData priority="Low" /></layoutData></Button><Button\r\n\t\t\ttext="Routing"\r\n\t\t\ttype="Transparent"\r\n\t\t\tpress="navigateToRouting"><layoutData><OverflowToolbarLayoutData priority="Low" /></layoutData></Button><Button\r\n\t\t\ttext="List"\r\n\t\t\ttype="Transparent"><layoutData><OverflowToolbarLayoutData priority="Low" /></layoutData></Button><Button\r\n\t\t\ttext="Tools"\r\n\t\t\ttype="Transparent"><layoutData><OverflowToolbarLayoutData priority="Low" /></layoutData></Button><tnt:ToolHeaderUtilitySeparator/><ToolbarSpacer><layoutData><OverflowToolbarLayoutData\r\n\t\t\t\t\tpriority="NeverOverflow"\r\n\t\t\t\t\tminWidth="20px"\r\n\t\t\t\t/></layoutData></ToolbarSpacer><Button\r\n\t\t\ttext="Alan Smith"\r\n\t\t\ttype="Transparent"\r\n\t\t\tpress="onUserNamePress"><layoutData><OverflowToolbarLayoutData priority="NeverOverflow" /></layoutData></Button><Button\r\n\t\t\ticon="sap-icon://home"\r\n\t\t\ttype="Transparent"\r\n\t\t\tpress="onHomePress"><layoutData><OverflowToolbarLayoutData priority="NeverOverflow" /></layoutData></Button><IconTabHeader\r\n\t\t\tid="iconTabHeader"\r\n\t\t\tselectedKey="invalidKey"\r\n\t\t\tselect="onSelectTab"\r\n\t\t\tbackgroundDesign="Transparent"><layoutData><OverflowToolbarLayoutData\r\n\t\t\t\t\tpriority="NeverOverflow"\r\n\t\t\t\t\tshrinkable="true"\r\n\t\t\t\t/></layoutData><items><IconTabFilter key="itf1" text="Documentation" /><IconTabFilter key="itf2" text="Explored" /><IconTabFilter key="itf3" text="API Reference" /><IconTabFilter key="itf4" text="Demo Apps" /></items></IconTabHeader></tnt:ToolHeader><App\r\n\t\tid="app"\r\n\t\tbusy="{appView>/busy}"\r\n\t\tbusyIndicatorDelay="{appView>/delay}" /></mvc:View>\r\n',
    'sap/ui/yesco/view/Carousel.view.xml':
      '<View\r\n\txmlns="sap.m"\r\n\txmlns:layout="sap.ui.layout"\r\n\txmlns:core="sap.ui.core"\r\n\tcontrollerName="sap.ui.yesco.controller.Carousel"\r\n><Carousel><pages><Image\r\n\t\t\t\tsrc="https://picsum.photos/200/300"\r\n\t\t\t\talt="Example picture of speakers"\r\n\t\t\t/><Image\r\n\t\t\t\tsrc="https://picsum.photos/200/300"\r\n\t\t\t\talt="Example picture of USB flash drive"\r\n\t\t\t/></pages></Carousel></View>',
    'sap/ui/yesco/view/Detail.view.xml':
      '<mvc:View\n\tcontrollerName="sap.ui.yesco.controller.Detail"\n\txmlns="sap.m"\n\txmlns:semantic="sap.f.semantic"\n\txmlns:mvc="sap.ui.core.mvc"\n><semantic:SemanticPage\n\t\tid="detailPage"\n\t\tbusy="{detailView>/busy}"\n\t\tbusyIndicatorDelay="{detailView>/delay}"\n\t><semantic:titleHeading><Title\n\t\t\t\ttext="{ProductName}"\n\t\t\t\tlevel="H2"\n\t\t\t/></semantic:titleHeading><semantic:headerContent><ObjectAttribute title="{i18n>priceTitle}"/><ObjectNumber\n\t\t\t\tid="objectHeaderNumber"\n\t\t\t\tnumber="{\n\t\t\t\t\tpath: \'UnitPrice\',\n\t\t\t\t\tformatter: \'.formatter.currencyValue\'\n\t\t\t\t}"\n\t\t\t/></semantic:headerContent><semantic:content></semantic:content><semantic:sendEmailAction><semantic:SendEmailAction\n\t\t\t\tid="shareEmail"\n\t\t\t\tpress=".onSendEmailPress"\n\t\t\t/></semantic:sendEmailAction><semantic:closeAction><semantic:CloseAction\n\t\t\t\tid="closeColumn"\n\t\t\t\tpress=".onCloseDetailPress"\n\t\t\t/></semantic:closeAction><semantic:fullScreenAction><semantic:FullScreenAction\n\t\t\t\tid="enterFullScreen"\n\t\t\t\tvisible="{= !${device>/system/phone} &amp;&amp; !${appView>/actionButtonsInfo/midColumn/fullScreen}}"\n\t\t\t\tpress=".toggleFullScreen"\n\t\t\t/></semantic:fullScreenAction><semantic:exitFullScreenAction><semantic:ExitFullScreenAction\n\t\t\t\tid="exitFullScreen"\n\t\t\t\tvisible="{= !${device>/system/phone} &amp;&amp; ${appView>/actionButtonsInfo/midColumn/fullScreen}}"\n\t\t\t\tpress=".toggleFullScreen"\n\t\t\t/></semantic:exitFullScreenAction></semantic:SemanticPage></mvc:View>',
    'sap/ui/yesco/view/DetailNotFound.view.xml':
      '<mvc:View\r\n\tcontrollerName="sap.ui.yesco.controller.DetailNotFound"\r\n\txmlns="sap.m"\r\n\txmlns:mvc="sap.ui.core.mvc"><MessagePage\r\n\t\tid="page"\r\n\t\ttitle="{i18n>detailTitle}"\r\n\t\ttext="{i18n>noObjectFoundText}"\r\n\t\ticon="sap-icon://product"\r\n\t\tdescription=""\r\n\t\tshowNavButton="{=\r\n\t\t\t${device>/system/phone} ||\r\n\t\t\t${device>/system/tablet} &amp;&amp;\r\n\t\t\t${device>/orientation/portrait}\r\n\t\t}"\r\n\t\tnavButtonPress=".onNavBack"></MessagePage></mvc:View>',
    'sap/ui/yesco/view/Home.view.xml':
      '<mvc:View\r\n\tcontrollerName="sap.ui.yesco.controller.Home"\r\n\txmlns="sap.m"\r\n\txmlns:mvc="sap.ui.core.mvc"><Page title="{i18n>appTitle}" class="sapUiResponsiveContentPadding"><content><Button id="employeeListBtn" text="{i18n>ShowEmployeeList}" press=".onNavToEmployees" class="sapUiTinyMarginEnd"/></content></Page></mvc:View>\r\n',
    'sap/ui/yesco/view/Master.view.xml':
      '<mvc:View\n\tcontrollerName="sap.ui.yesco.controller.Master"\n\txmlns="sap.m"\n\txmlns:semantic="sap.f.semantic"\n\txmlns:yesco="sap.ui.yesco.control"\n\txmlns:mvc="sap.ui.core.mvc"><semantic:SemanticPage\n\t\tid="masterPage"\n\t\tpreserveHeaderStateOnScroll="true"\n\t\ttoggleHeaderOnTitleClick="false"><semantic:titleHeading><Title\n\t\t\t\tid="masterPageTitle"\n\t\t\t\ttext="{masterView>/title}"\n\t\t\t\tlevel="H2"/></semantic:titleHeading><semantic:content><List\n\t\t\t\tid="list"\n\t\t\t\twidth="auto"\n\t\t\t\tclass="sapFDynamicPageAlignContent"\n\t\t\t\titems="{\n\t\t\t\t\tpath: \'/Products\',\n\t\t\t\t\tsorter: {\n\t\t\t\t\t\tpath: \'ProductName\',\n\t\t\t\t\t\tdescending: false\n\t\t\t\t\t},\n\t\t\t\t\tgroupHeaderFactory: \'.createGroupHeader\'\n\t\t\t\t}"\n\t\t\t\tbusyIndicatorDelay="{masterView>/delay}"\n\t\t\t\tnoDataText="{masterView>/noDataText}"\n\t\t\t\tmode="{= ${device>/system/phone} ? \'None\' : \'SingleSelectMaster\'}"\n\t\t\t\tgrowing="true"\n\t\t\t\tgrowingScrollToLoad="true"\n\t\t\t\tupdateFinished=".onUpdateFinished"\n\t\t\t\tselectionChange=".onSelectionChange"><infoToolbar><Toolbar\n\t\t\t\t\t\tactive="true"\n\t\t\t\t\t\tid="filterBar"\n\t\t\t\t\t\tvisible="{masterView>/isFilterBarVisible}"\n\t\t\t\t\t\tpress=".onOpenViewSettings"><Title\n\t\t\t\t\t\t\tid="filterBarLabel"\n\t\t\t\t\t\t\ttext="{masterView>/filterBarLabel}"\n\t\t\t\t\t\t\tlevel="H3"/></Toolbar></infoToolbar><headerToolbar><OverflowToolbar><SearchField\n\t\t\t\t\t\t\tid="searchField"\n\t\t\t\t\t\t\tshowRefreshButton="true"\n\t\t\t\t\t\t\ttooltip="{i18n>masterSearchTooltip}"\n\t\t\t\t\t\t\tsearch=".onSearch"\n\t\t\t\t\t\t\twidth="auto"><layoutData><OverflowToolbarLayoutData\n\t\t\t\t\t\t\t\t\tminWidth="150px"\n\t\t\t\t\t\t\t\t\tmaxWidth="240px"\n\t\t\t\t\t\t\t\t\tshrinkable="true"\n\t\t\t\t\t\t\t\t\tpriority="NeverOverflow"/></layoutData></SearchField><ToolbarSpacer/><Button\n\t\t\t\t\t\t\tid="sortButton"\n\t\t\t\t\t\t\tpress=".onOpenViewSettings"\n\t\t\t\t\t\t\ticon="sap-icon://sort"\n\t\t\t\t\t\t\ttype="Transparent"/><Button\n\t\t\t\t\t\t\tid="filterButton"\n\t\t\t\t\t\t\tpress=".onOpenViewSettings"\n\t\t\t\t\t\t\ticon="sap-icon://filter"\n\t\t\t\t\t\t\ttype="Transparent"/><Button\n\t\t\t\t\t\t\tid="groupButton"\n\t\t\t\t\t\t\tpress=".onOpenViewSettings"\n\t\t\t\t\t\t\ticon="sap-icon://group-2"\n\t\t\t\t\t\t\ttype="Transparent"/></OverflowToolbar></headerToolbar><items><ObjectListItem\n\t\t\t\t\t\ttype="Navigation"\n\t\t\t\t\t\tpress=".onSelectionChange"\n\t\t\t\t\t\ttitle="{ProductName}"\n\t\t\t\t\t\tnumber="{\n\t\t\t\t\t\t\tpath: \'UnitPrice\',\n\t\t\t\t\t\t\tformatter: \'.formatter.currencyValue\'\n\t\t\t\t\t\t}"\n></ObjectListItem></items></List><yesco:Placeholder id="testPlaceholder" width="100%" /></semantic:content></semantic:SemanticPage></mvc:View>',
    'sap/ui/yesco/view/NotFound.view.xml':
      '<mvc:View\r\n\tcontrollerName="sap.ui.yesco.controller.NotFound"\r\n\txmlns="sap.m"\r\n\txmlns:mvc="sap.ui.core.mvc"><MessagePage\r\n\t\ttitle="{i18n>notFoundTitle}"\r\n\t\ttext="{i18n>notFoundText}"\r\n\t\tdescription="{i18n>notFoundDescription}"\r\n\t\ticon="sap-icon://document"\r\n\t\tshowNavButton="true"\r\n\t\tnavButtonPress=".onNavBack"></MessagePage></mvc:View>\r\n',
    'sap/ui/yesco/view/ViewSettingsDialog.fragment.xml':
      '<core:FragmentDefinition\n\txmlns="sap.m"\n\txmlns:core="sap.ui.core"><ViewSettingsDialog\n\t\tid="viewSettingsDialog"\n\t\tconfirm=".onConfirmViewSettingsDialog"><sortItems><ViewSettingsItem\n\t\t\t\ttext="{i18n>masterSort1}"\n\t\t\t\tkey="ProductName"\n\t\t\t\tselected="true"/><ViewSettingsItem\n\t\t\t\ttext="{i18n>masterSort2}"\n\t\t\t\tkey="UnitPrice"/></sortItems><filterItems><ViewSettingsFilterItem\n\t\t\t\tid="filterItems"\n\t\t\t\ttext="{i18n>masterFilterName}"\n\t\t\t\tmultiSelect="false"><items><ViewSettingsItem\n\t\t\t\t\t\tid="viewFilter1"\n\t\t\t\t\t\ttext="{i18n>masterFilter1}"\n\t\t\t\t\t\tkey="Filter1"/><ViewSettingsItem\n\t\t\t\t\t\tid="viewFilter2"\n\t\t\t\t\t\ttext="{i18n>masterFilter2}"\n\t\t\t\t\t\tkey="Filter2"/></items></ViewSettingsFilterItem></filterItems><groupItems><ViewSettingsItem\n\t\t\t\ttext="{i18n>masterGroup1}"\n\t\t\t\tkey="UnitPrice"/></groupItems></ViewSettingsDialog></core:FragmentDefinition>',
    'sap/ui/yesco/view/employee/EmployeeList.view.xml':
      '<mvc:View\r\n\tcontrollerName="sap.ui.yesco.controller.employee.EmployeeList"\r\n\txmlns="sap.m"\r\n\txmlns:mvc="sap.ui.core.mvc"><Page\r\n\t\tid="employeeListPage"\r\n\t\ttitle="{i18n>EmployeeList}"\r\n\t\tshowNavButton="true"\r\n\t\tnavButtonPress=".onNavBack"\r\n\t\tclass="sapUiResponsiveContentPadding"><content><List id="employeeList" headerText="{i18n>ListOfAllEmployees}" items="{/Employees}"><items><StandardListItem\r\n\t\t\t\t\t\ttitle="{FirstName} {LastName}"\r\n\t\t\t\t\t\ticonDensityAware="false"\r\n\t\t\t\t\t\ticonInset="false"/></items></List></content></Page></mvc:View>\r\n',
  },
});
