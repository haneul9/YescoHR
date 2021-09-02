sap.ui.define(
  [
    'sap/m/GroupHeaderListItem',
    'sap/ui/Device',
    'sap/ui/core/Fragment',
    'sap/ui/model/Filter',
    'sap/ui/model/FilterOperator',
    'sap/ui/model/Sorter',
    'sap/ui/model/json/JSONModel',
    '../model/formatter',
    './BaseController', //
  ],
  (
    GroupHeaderListItem,
    Device,
    Fragment,
    Filter,
    FilterOperator,
    Sorter,
    JSONModel,
    formatter,
    BaseController
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.controller.Master', {
      formatter: formatter,

      /* =========================================================== */
      /* lifecycle methods                                           */
      /* =========================================================== */

      /**
       * Called when the master list controller is instantiated. It sets up the event handling for the master/detail communication and other lifecycle tasks.
       * @public
       */
      onInit() {
        // Control state model
        const oList = this.byId('list');
        const oViewModel = this._createViewModel();
        // Put down master list's original value for busy indicator delay,
        // so it can be restored later on. Busy handling on the master list is
        // taken care of by the master list itself.
        const iOriginalBusyDelay = oList.getBusyIndicatorDelay();

        this._oGroupFunctions = {
          UnitPrice(oContext) {
            const oResourceBundle = this.getResourceBundle();
            const iNumber = oContext.getProperty('UnitPrice');
            let key;
            let text;

            if (iNumber <= 20) {
              key = 'LE20';
              text = oResourceBundle.getText('masterGroup1Header1');
            } else {
              key = 'GT20';
              text = oResourceBundle.getText('masterGroup1Header2');
            }
            return {
              key: key,
              text: text,
            };
          },
        };

        this._oList = oList;
        // keeps the filter and search state
        this._oListFilterState = {
          aFilter: [],
          aSearch: [],
        };

        this.setModel(oViewModel, 'masterView');
        // Make sure, busy indication is showing immediately so there is no
        // break after the busy indication for loading the view's meta data is
        // ended (see promise 'oWhenMetadataIsLoaded' in AppController)
        oList.attachEventOnce('updateFinished', function () {
          // Restore original busy indicator delay for the list
          oViewModel.setProperty('/delay', iOriginalBusyDelay);
        });

        this.getView().addEventDelegate({
          onBeforeFirstShow: () => {
            this.getOwnerComponent().oListSelector.setBoundMasterList(oList);
          },
        });

        this.getRouter().getRoute('master').attachPatternMatched(this._onMasterMatched, this); // TODO : master 전환 공통 function 호출로 수정 필요 (master 전환 후 callback 호출 때문)
        this.getRouter().attachBypassed(this.onBypassed, this);
      },

      /* =========================================================== */
      /* event handlers                                              */
      /* =========================================================== */

      /**
       * After list data is available, this handler method updates the
       * master list counter
       * @param {sap.ui.base.Event} oEvent the update finished event
       * @public
       */
      onUpdateFinished(oEvent) {
        // update the master list object counter after new data is loaded
        this._updateListItemCount(oEvent.getParameter('total'));
      },

      /**
       * Event handler for the master search field. Applies current
       * filter value and triggers a new search. If the search field's
       * 'refresh' button has been pressed, no new search is triggered
       * and the list binding is refresh instead.
       * @param {sap.ui.base.Event} oEvent the search event
       * @public
       */
      onSearch(oEvent) {
        if (oEvent.getParameters().refreshButtonPressed) {
          // Search field's 'refresh' button has been pressed.
          // This is visible if you select any master list item.
          // In this case no new search is triggered, we only
          // refresh the list binding.
          this.onRefresh();
          return;
        }

        const sQuery = oEvent.getParameter('query');

        if (sQuery) {
          this._oListFilterState.aSearch = [
            new Filter('ProductName', FilterOperator.Contains, sQuery),
          ];
        } else {
          this._oListFilterState.aSearch = [];
        }
        this._applyFilterSearch();
      },

      /**
       * Event handler for refresh event. Keeps filter, sort
       * and group settings and refreshes the list binding.
       * @public
       */
      onRefresh() {
        this._oList.getBinding('items').refresh();
      },

      /**
       * Event handler for the filter, sort and group buttons to open the ViewSettingsDialog.
       * @param {sap.ui.base.Event} oEvent the button press event
       * @public
       */
      onOpenViewSettings(oEvent) {
        let sDialogTab = 'filter';
        if (oEvent.getSource() instanceof sap.m.Button) {
          const sButtonId = oEvent.getSource().getId();
          if (sButtonId.match('sort')) {
            sDialogTab = 'sort';
          } else if (sButtonId.match('group')) {
            sDialogTab = 'group';
          }
        }
        // load asynchronous XML fragment
        if (!this.byId('viewSettingsDialog')) {
          Fragment.load({
            id: this.getView().getId(),
            name: 'sap.ui.yesco.view.ViewSettingsDialog',
            controller: this,
          }).then((oDialog) => {
            // connect dialog to the root view of this component (models, lifecycle)
            this.getView().addDependent(oDialog);
            oDialog.addStyleClass(this.getOwnerComponent().getContentDensityClass());
            oDialog.open(sDialogTab);
          });
        } else {
          this.byId('viewSettingsDialog').open(sDialogTab);
        }
      },

      /**
       * Event handler called when ViewSettingsDialog has been confirmed, i.e.
       * has been closed with 'OK'. In the case, the currently chosen filters, sorters or groupers
       * are applied to the master list, which can also mean that they
       * are removed from the master list, in case they are
       * removed in the ViewSettingsDialog.
       * @param {sap.ui.base.Event} oEvent the confirm event
       * @public
       */
      onConfirmViewSettingsDialog(oEvent) {
        const aFilterItems = oEvent.getParameters().filterItems;
        const aFilters = [];
        const aCaptions = [];

        // update filter state:
        // combine the filter array and the filter string
        aFilterItems.forEach((oItem) => {
          switch (oItem.getKey()) {
            case 'Filter1': {
              aFilters.push(new Filter('UnitPrice', FilterOperator.LE, 100));
              break;
            }
            case 'Filter2': {
              aFilters.push(new Filter('UnitPrice', FilterOperator.GT, 100));
              break;
            }
            default: {
              break;
            }
          }
          aCaptions.push(oItem.getText());
        });

        this._oListFilterState.aFilter = aFilters;
        this._updateFilterBar(aCaptions.join(', '));
        this._applyFilterSearch();
        this._applySortGroup(oEvent);
      },

      /**
       * Apply the chosen sorter and grouper to the master list
       * @param {sap.ui.base.Event} oEvent the confirm event
       * @private
       */
      _applySortGroup(oEvent) {
        const mParams = oEvent.getParameters();
        const aSorters = [];
        let sPath;
        let bDescending;

        // apply sorter to binding
        // (grouping comes before sorting)
        if (mParams.groupItem) {
          sPath = mParams.groupItem.getKey();
          bDescending = mParams.groupDescending;
          aSorters.push(new Sorter(sPath, bDescending, this._oGroupFunctions[sPath]));
        } else {
          sPath = mParams.sortItem.getKey();
          bDescending = mParams.sortDescending;
          aSorters.push(new Sorter(sPath, bDescending));
        }
        this._oList.getBinding('items').sort(aSorters);
      },

      /**
       * Event handler for the list selection event
       * @param {sap.ui.base.Event} oEvent the list selectionChange event
       * @public
       */
      onSelectionChange(oEvent) {
        const oList = oEvent.getSource();
        const bSelected = oEvent.getParameter('selected');

        // skip navigation when deselecting an item in multi selection mode
        if (!(oList.getMode() === 'MultiSelect' && !bSelected)) {
          // get the list item, either from the listItem parameter or from the event's source itself (will depend on the device-dependent mode).
          this._showDetail(oEvent.getParameter('listItem') || oEvent.getSource());
        }
      },

      /**
       * Event handler for the bypassed event, which is fired when no routing pattern matched.
       * If there was an object selected in the master list, that selection is removed.
       * @public
       */
      onBypassed() {
        this._oList.removeSelections(true);
      },

      /**
       * Used to create GroupHeaders with non-capitalized caption.
       * These headers are inserted into the master list to
       * group the master list's items.
       * @param {Object} oGroup group whose text is to be displayed
       * @public
       * @returns {sap.m.GroupHeaderListItem} group header with non-capitalized caption.
       */
      createGroupHeader(oGroup) {
        return new GroupHeaderListItem({
          title: oGroup.text,
          upperCase: false,
        });
      },

      /**
       * Event handler for navigating back.
       * We navigate back in the browser historz
       * @public
       */
      onNavBack() {
        history.go(-1);
      },

      /* =========================================================== */
      /* begin: internal methods                                     */
      /* =========================================================== */

      _createViewModel() {
        const oResourceBundle = this.getResourceBundle();

        return new JSONModel({
          isFilterBarVisible: false,
          filterBarLabel: '',
          delay: 0,
          title: oResourceBundle.getText('masterTitleCount', [0]),
          noDataText: oResourceBundle.getText('masterListNoDataText'),
          sortBy: 'ProductName',
          groupBy: 'None',
        });
      },

      _onMasterMatched() {
        //Set the layout property of the FCL control to 'OneColumn'
        this.getModel('appView').setProperty('/layout', 'OneColumn');
      },

      /**
       * Shows the selected item on the detail page
       * On phones a additional history entry is created
       * @param {sap.m.ObjectListItem} oItem selected Item
       * @private
       */
      _showDetail(oItem) {
        const bReplace = !Device.system.phone;

        // set the layout property of FCL control to show two columns
        this.getModel('appView').setProperty('/layout', 'TwoColumnsMidExpanded');
        this.getRouter().navTo(
          'object',
          {
            objectId: oItem.getBindingContext().getProperty('ProductID'),
          },
          bReplace
        );
      },

      /**
       * Sets the item count on the master list header
       * @param {integer} iTotalItems the total number of items in the list
       * @private
       */
      _updateListItemCount(iTotalItems) {
        // only update the counter if the length is final
        if (this._oList.getBinding('items').isLengthFinal()) {
          const sTitle = this.getResourceBundle().getText('masterTitleCount', [iTotalItems]);
          this.getModel('masterView').setProperty('/title', sTitle);
        }
      },

      /**
       * Internal helper method to apply both filter and search state together on the list binding
       * @private
       */
      _applyFilterSearch() {
        const aFilters = this._oListFilterState.aSearch.concat(this._oListFilterState.aFilter);
        const oMasterViewModel = this.getModel('masterView');

        this._oList.getBinding('items').filter(aFilters, 'Application');

        // changes the noDataText of the list in case there are no filter results
        if (aFilters.length !== 0) {
          oMasterViewModel.setProperty(
            '/noDataText',
            this.getResourceBundle().getText('masterListNoDataWithFilterOrSearchText')
          );
        } else if (this._oListFilterState.aSearch.length > 0) {
          // only reset the no data text to default when no new search was triggered
          oMasterViewModel.setProperty(
            '/noDataText',
            this.getResourceBundle().getText('masterListNoDataText')
          );
        }
      },

      /**
       * Internal helper method that sets the filter bar visibility property and the label's caption to be shown
       * @param {string} sFilterBarText the selected filter value
       * @private
       */
      _updateFilterBar(sFilterBarText) {
        const oMasterViewModel = this.getModel('masterView');

        oMasterViewModel.setProperty(
          '/isFilterBarVisible',
          this._oListFilterState.aFilter.length > 0
        );
        oMasterViewModel.setProperty(
          '/filterBarLabel',
          this.getResourceBundle().getText('masterFilterBarText', [sFilterBarText])
        );
      },
    });
  }
);
