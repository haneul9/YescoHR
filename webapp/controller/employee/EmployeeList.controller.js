sap.ui.define(
  [
    'sap/ui/yesco/controller/BaseController', // prettier 방지용 주석
    "sap/m/MessageToast",
    "sap/ui/Device",
    "sap/base/Log"
  ],
  (
    BaseController, // prettier 방지용 주석
    MessageToast,
    Device,
    Log
  ) => {
    'use strict';

    class EmployeeList extends BaseController {
      onInit() {
        this.getSplitAppObj().setHomeIcon({
          'phone': 'phone-icon.png',
          'tablet': 'tablet-icon.png',
          'icon': 'desktop.ico'
        });
  
        Device.orientation.attachHandler(this.onOrientationChange, this);
      }

      onExit() {
        Device.orientation.detachHandler(this.onOrientationChange, this);
      }

      onOrientationChange(mParams) {
        const sMsg = "Orientation now is: " + (mParams.landscape ? "Landscape" : "Portrait");
        MessageToast.show(sMsg, { duration: 5000 });
      }

      onPressNavToDetail() {
        this.getSplitAppObj().to(this.createId("detailDetail"));
      }

      onPressDetailBack() {
        this.getSplitAppObj().backDetail();
      }

      onPressModeBtn(oEvent) {
        const sSplitAppMode = oEvent.getSource().getSelectedButton().getCustomData()[0].getValue();

        this.getSplitAppObj().setMode(sSplitAppMode);
        MessageToast.show("Split Container mode is changed to: " + sSplitAppMode, { duration: 5000 });
      }

      onPressGoToMaster() {
        this.getSplitAppObj().toMaster(this.createId("master2"));
      }

      onPressMasterBack() {
        this.getSplitAppObj().backMaster();
      }

      onListItemPress(oEvent) {
        const sToPageId = oEvent.getParameter("listItem").getCustomData()[0].getValue();

			  this.getSplitAppObj().toDetail(this.createId(sToPageId));
      }

      getSplitAppObj() {
        const result = this.byId("SplitAppDemo");
        if (!result) {
          Log.info("SplitApp object can't be found");
        }
        return result;
      }
    }

    return EmployeeList;
  }
);
