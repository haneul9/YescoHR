sap.ui.define(
  [
    // prettier 방지용 주석
    './BaseController',
    '../model/formatter',
    'sap/m/MessageToast',
    'sap/ui/core/Fragment',
    'sap/ui/model/Filter',
    'sap/ui/model/FilterOperator',
    'sap/ui/model/json/JSONModel',
    'sap/ui/yesco/common/AppUtils',
  ],
  (
    // prettier 방지용 주석
    BaseController,
    formatter,
    MessageToast,
    Fragment,
    Filter,
    FilterOperator,
    JSONModel,
    AppUtils
  ) => {
    'use strict';

    class Components extends BaseController {
      formatter;

      /* =========================================================== */
      /* lifecycle methods                                           */
      /* =========================================================== */

      onBeforeShow() {
        var oModel = new JSONModel(sap.ui.require.toUrl('sap/ui/yesco/localService/mockdata/products.json'));
        // The default limit of the model is set to 100. We want to show all the entries.
        oModel.setSizeLimit(100000);
        this.getView().setModel(oModel);
      }

      /* =========================================================== */
      /* event handlers                                              */
      /* =========================================================== */

      /**
       * Triggered by the table's 'updateFinished' event: after new table
       * data is available, this handler method updates the table counter.
       * This should only happen if the update was successful, which is
       * why this handler is attached to 'updateFinished' and not to the
       * table's list binding's 'dataReceived' method.
       * @param {sap.ui.base.Event} oEvent the update finished event
       * @public
       */
      onUpdateFinished(oEvent) {
        // update the worklist's object counter after the table update
        var sTitle,
          oTable = oEvent.getSource(),
          iTotalItems = oEvent.getParameter('total');
        // only update the counter if the length is final and
        // the table is not empty
        if (iTotalItems && oTable.getBinding('items').isLengthFinal()) {
          sTitle = this.getResourceBundle().getText('worklistTableTitleCount', [iTotalItems]);
        } else {
          sTitle = this.getResourceBundle().getText('worklistTableTitle');
        }
        this.getModel('worklistView').setProperty('/worklistTableTitle', sTitle);
      }

      /**
       * Event handler when a table item gets pressed
       * @param {sap.ui.base.Event} oEvent the table selectionChange event
       * @public
       */
      onPress(oEvent) {
        // The source is the list item that got pressed
        this._showObject(oEvent.getSource());
      }

      /**
       * Event handler for navigating back.
       * We navigate back in the browser history
       * @public
       */
      onNavBack() {
        // eslint-disable-next-line sap-no-history-manipulation
        window.history.go(-1);
      }

      onSearch(oEvent) {
        if (oEvent.getParameters().refreshButtonPressed) {
          // Search field's 'refresh' button has been pressed.
          // This is visible if you select any master list item.
          // In this case no new search is triggered, we only
          // refresh the list binding.
          this.onRefresh();
        } else {
          var aTableSearchState = [];
          var sQuery = oEvent.getParameter('query');

          if (sQuery && sQuery.length > 0) {
            aTableSearchState = [new Filter('ProductName', FilterOperator.Contains, sQuery)];
          }
          this._applySearch(aTableSearchState);
        }
      }

      /**
       * Event handler for refresh event. Keeps filter, sort
       * and group settings and refreshes the list binding.
       * @public
       */
      onRefresh() {
        var oTable = this.byId('table');
        oTable.getBinding('items').refresh();
      }

      /* =========================================================== */
      /* internal methods                                            */
      /* =========================================================== */

      /**
       * Shows the selected item on the object page
       * On phones a additional history entry is created
       * @param {sap.m.ObjectListItem} oItem selected Item
       * @private
       */
      _showObject(oItem) {
        this.getRouter().navTo('object', {
          objectId: oItem.getBindingContext().getProperty('ProductID'),
        });
      }

      /**
       * Internal helper method to apply both filter and search state together on the list binding
       * @param {sap.ui.model.Filter[]} aTableSearchState An array of filters for the search
       * @private
       */
      _applySearch(aTableSearchState) {
        var oTable = this.byId('table'),
          oViewModel = this.getModel('worklistView');
        oTable.getBinding('items').filter(aTableSearchState, 'Application');
        // changes the noDataText of the list in case there are no filter results
        if (aTableSearchState.length !== 0) {
          oViewModel.setProperty('/tableNoDataText', this.getResourceBundle().getText('worklistNoDataWithSearchText'));
        }
      }

      onValueHelpRequest(oEvent) {
        var sInputValue = oEvent.getSource().getValue(),
          oView = this.getView();

        if (!this._pValueHelpDialog) {
          this._pValueHelpDialog = Fragment.load({
            id: oView.getId(),
            name: 'pub.pubsample.view.ValueHelpDialog',
            controller: this,
          }).then(function (oDialog) {
            oView.addDependent(oDialog);
            return oDialog;
          });
        }
        this._pValueHelpDialog.then(function (oDialog) {
          // Create a filter for the binding
          oDialog.getBinding('items').filter([new Filter('Name', FilterOperator.Contains, sInputValue)]);
          // Open ValueHelpDialog filtered by the input's value
          oDialog.open(sInputValue);
        });
      }

      onValueHelpSearch(oEvent) {
        var sValue = oEvent.getParameter('value');
        var oFilter = new Filter('Name', FilterOperator.Contains, sValue);

        oEvent.getSource().getBinding('items').filter([oFilter]);
      }

      onValueHelpClose(oEvent) {
        var oSelectedItem = oEvent.getParameter('selectedItem');
        oEvent.getSource().getBinding('items').filter([]);

        if (!oSelectedItem) {
          return;
        }

        this.byId('productInput').setValue(oSelectedItem.getTitle());
      }

      handleSelectionChange(oEvent) {
        var changedItems = oEvent.getParameter('changedItems') || [oEvent.getParameter('changedItem')];
        var isSelected = oEvent.getParameter('selected');
        var isSelectAllTriggered = oEvent.getParameter('selectAll');
        var state = isSelected ? 'Selected' : 'Deselected';

        var fnLogChangedItems = function () {
          var changesLog = "Event 'selectionChange':\n Select all: " + isSelectAllTriggered + ':\n ';

          changedItems.forEach(function (oItem) {
            changesLog += state + " '" + oItem.getText() + "'" + '\n';
          });

          return changesLog;
        };

        MessageToast.show(fnLogChangedItems());
      }

      handleSelectionFinish(oEvent) {
        var selectedItems = oEvent.getParameter('selectedItems');
        var messageText = "Event 'selectionFinished': [";

        for (var i = 0; i < selectedItems.length; i++) {
          messageText += "'" + selectedItems[i].getText() + "'";
          if (i != selectedItems.length - 1) {
            messageText += ',';
          }
        }

        messageText += ']';

        MessageToast.show(messageText, {
          width: 'auto',
        });
      }
    }

    return Components;
  }
);
