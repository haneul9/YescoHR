sap.ui.define(
  [
    'sap/m/library',
    'sap/ui/model/json/JSONModel',
    '../model/formatter',
    './BaseController', //
  ],
  (mobileLibrary, JSONModel, formatter, BaseController) => {
    'use strict';

    // shortcut for sap.m.URLHelper
    const URLHelper = mobileLibrary.URLHelper;

    return BaseController.extend('sap.ui.yesco.controller.Detail', {
      formatter: formatter,

      /* =========================================================== */
      /* lifecycle methods                                           */
      /* =========================================================== */

      onInit() {
        // Model used to manipulate control states. The chosen values make sure,
        // detail page is busy indication immediately so there is no break in
        // between the busy indication for loading the view's meta data
        const oDetailViewModel = new JSONModel({
          busy: false,
          delay: 0,
        });

        this.getRouter().getRoute('object').attachPatternMatched(this._onObjectMatched, this);

        this.setModel(oDetailViewModel, 'detailView');

        this.getOwnerComponent()
          .getModel()
          .metadataLoaded()
          .then(this._onMetadataLoaded.bind(this));
      },

      /* =========================================================== */
      /* event handlers                                              */
      /* =========================================================== */

      /**
       * Event handler when the share by E-Mail button has been clicked
       * @public
       */
      onSendEmailPress() {
        const oDetailViewModel = this.getModel('detailView');

        URLHelper.triggerEmail(
          null,
          oDetailViewModel.getProperty('/shareSendEmailSubject'),
          oDetailViewModel.getProperty('/shareSendEmailMessage')
        );
      },

      /* =========================================================== */
      /* begin: internal methods                                     */
      /* =========================================================== */

      /**
       * Binds the view to the object path and expands the aggregated line items.
       * @function
       * @param {sap.ui.base.Event} oEvent pattern match event in route 'object'
       * @private
       */
      _onObjectMatched(oEvent) {
        const sObjectId = oEvent.getParameter('arguments').objectId;

        this.getModel('appView').setProperty('/layout', 'TwoColumnsMidExpanded');
        this.getModel()
          .metadataLoaded()
          .then(() => {
            var sObjectPath = this.getModel().createKey('Products', {
              ProductID: sObjectId,
            });
            this._bindView('/' + sObjectPath);
          });
      },

      /**
       * Binds the view to the object path. Makes sure that detail view displays
       * a busy indicator while data for the corresponding element binding is loaded.
       * @function
       * @param {string} sObjectPath path to the object to be bound to the view.
       * @private
       */
      _bindView(sObjectPath) {
        // Set busy indicator during view binding
        const oDetailViewModel = this.getModel('detailView');

        // If the view was not bound yet its not busy, only if the binding requests data it is set to busy again
        oDetailViewModel.setProperty('/busy', false);

        this.getView().bindElement({
          path: sObjectPath,
          events: {
            change: this._onBindingChange.bind(this),
            dataRequested() {
              oDetailViewModel.setProperty('/busy', true);
            },
            dataReceived() {
              oDetailViewModel.setProperty('/busy', false);
            },
          },
        });
      },

      _onBindingChange() {
        const oDetailView = this.getView();
        const oElementBinding = oDetailView.getElementBinding();

        // No data for the binding
        if (!oElementBinding.getBoundContext()) {
          this.getRouter().getTargets().display('detailObjectNotFound');
          // if object could not be found, the selection in the master list
          // does not make sense anymore.
          this.getOwnerComponent().oListSelector.clearMasterListSelection();
          return;
        }

        const sPath = oElementBinding.getPath();
        const oResourceBundle = this.getResourceBundle();
        const oObject = oDetailView.getModel().getObject(sPath);
        const sObjectId = oObject.ProductID;
        const sObjectName = oObject.ProductName;
        const oDetailViewModel = this.getModel('detailView');

        this.getOwnerComponent().oListSelector.selectAListItem(sPath);

        oDetailViewModel.setProperty(
          '/shareSendEmailSubject',
          oResourceBundle.getText('shareSendEmailObjectSubject', [sObjectId])
        );
        oDetailViewModel.setProperty(
          '/shareSendEmailMessage',
          oResourceBundle.getText('shareSendEmailObjectMessage', [
            sObjectName,
            sObjectId,
            location.href,
          ])
        );
      },

      _onMetadataLoaded() {
        // Store original busy indicator delay for the detail view
        const iOriginalViewBusyDelay = this.getView().getBusyIndicatorDelay();
        const oDetailViewModel = this.getModel('detailView');

        // Make sure busy indicator is displayed immediately when
        // detail view is displayed for the first time
        oDetailViewModel.setProperty('/delay', 0);
        // Binding the view will set it to not busy - so the view is always busy if it is not bound
        oDetailViewModel.setProperty('/busy', true);
        // Restore original busy indicator delay for the detail view
        oDetailViewModel.setProperty('/delay', iOriginalViewBusyDelay);
      },

      /**
       * Set the full screen mode to false and navigate to master page
       */
      onCloseDetailPress() {
        this.getModel('appView').setProperty('/actionButtonsInfo/midColumn/fullScreen', false);
        // No item should be selected on master after detail page is closed
        this.getOwnerComponent().oListSelector.clearMasterListSelection();
        this.getRouter().navTo('master'); // TODO : master 전환 공통 function 호출로 수정 필요 (master 전환 후 callback 호출 때문)
      },

      /**
       * Toggle between full and non full screen mode.
       */
      toggleFullScreen() {
        const oAppViewModel = this.getModel('appView');
        const bFullScreen = oAppViewModel.getProperty('/actionButtonsInfo/midColumn/fullScreen');

        oAppViewModel.setProperty('/actionButtonsInfo/midColumn/fullScreen', !bFullScreen);

        if (!bFullScreen) {
          // store current layout and go full screen
          oAppViewModel.setProperty('/previousLayout', oAppViewModel.getProperty('/layout'));
          oAppViewModel.setProperty('/layout', 'MidColumnFullScreen');
        } else {
          // reset to previous layout
          oAppViewModel.setProperty('/layout', oAppViewModel.getProperty('/previousLayout'));
        }
      },
    });
  }
);
