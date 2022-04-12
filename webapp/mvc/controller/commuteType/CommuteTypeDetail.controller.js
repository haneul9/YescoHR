/* eslint-disable no-useless-call */
sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/yesco/control/MessageBox',
    'sap/ui/yesco/common/Appno',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/AttachFileAction',
    'sap/ui/yesco/common/FragmentEvent',
    'sap/ui/yesco/common/TextUtils',
    'sap/ui/yesco/common/TableUtils',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/mvc/controller/BaseController',
    'sap/ui/yesco/mvc/model/type/Date',
  ],
  (
    // prettier 방지용 주석
    MessageBox,
    Appno,
    AppUtils,
    AttachFileAction,
    FragmentEvent,
    TextUtils,
    TableUtils,
    Client,
    ServiceNames,
    BaseController
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.commuteType.CommuteTypeDetail', {
      LIST_PAGE_ID: 'container-ehr---commuteType',

      AttachFileAction: AttachFileAction,
      TextUtils: TextUtils,
      TableUtils: TableUtils,
      FragmentEvent: FragmentEvent,

      initializeModel() {
        return {
          FormData: {},
          Settings: {},
          WorkType: [],
          busy: false,
        };
      },

      // setData
      async onObjectMatched(oParameter) {
        const oDetailModel = this.getViewModel();

        oDetailModel.setData(this.initializeModel());

        try {
          // Input Field Imited
          oDetailModel.setProperty('/FieldLimit', _.assignIn(this.getEntityLimit(ServiceNames.WORKTIME, 'WorkScheduleApply')));
          oDetailModel.setProperty('/busy', true);

          const sPernr = this.getAppointeeProperty('Pernr');
          const oModel = this.getModel(ServiceNames.WORKTIME);
          // 대상자리스트
          const aOtpList = await Client.getEntitySet(oModel, 'SchkzList', {
            Pernr: sPernr,
          });

          oDetailModel.setProperty('/WorkType', aOtpList);

          const sDataKey = oParameter.oDataKey;

          if (sDataKey === 'N' || !sDataKey) {
            const oView = this.getView();
            const oListView = oView.getParent().getPage(this.LIST_PAGE_ID);
            const [oTargetData] = oListView.getModel().getProperty('/SelectedRow');
            const sZyymm = oParameter.zyymm;
            const sSchkz = oParameter.schkz;

            oDetailModel.setProperty('/FormData', {
              Appno: oTargetData.Appno,
              Pernr: sPernr,
              Zyymm: sZyymm,
              Schkz: sSchkz,
            });
            oDetailModel.setProperty('/ApplyInfo', oTargetData);
            oDetailModel.setProperty('/ApprovalDetails', oTargetData);
          }

          this.settingsAttachTable();
        } catch (oError) {
          this.debug(oError);
          AppUtils.handleError(oError);
        } finally {
          oDetailModel.setProperty('/busy', false);
        }
      },

      // override AttachFileCode
      getApprovalType() {
        return 'HR19';
      },

      getCurrentLocationText(oArguments) {
        const sAction = oArguments.oDataKey === 'N' ? this.getBundleText('LABEL_04002') : this.getBundleText('LABEL_00165');

        return sAction;
      },

      // 신청
      async onApplyBtn() {
        // {신청}하시겠습니까?
        MessageBox.confirm(this.getBundleText('MSG_00006', 'LABEL_00121'), {
          // 신청, 취소
          actions: [this.getBundleText('LABEL_00121'), this.getBundleText('LABEL_00118')],
          onClose: async (vPress) => {
            // 신청
            if (!vPress || vPress !== this.getBundleText('LABEL_00121')) {
              return;
            }

            try {
              AppUtils.setAppBusy(true);

              const oDetailModel = this.getViewModel();
              const sAppno = oDetailModel.getProperty('/FormData/Appno');

              if (!sAppno || _.parseInt(sAppno) === 0) {
                const sAppno = await Appno.get.call(this);

                oDetailModel.setProperty('/FormData/Appno', sAppno);
                oDetailModel.setProperty('/FormData/Appda', new Date());
              }

              const oModel = this.getModel(ServiceNames.WORKTIME);
              const oFormData = oDetailModel.getProperty('/FormData');
              let oSendObject = {
                ...oFormData,
                Prcty: 'C',
              };

              // FileUpload
              await AttachFileAction.uploadFile.call(this, oFormData.Appno, this.getApprovalType());
              await Client.create(oModel, 'WorkScheduleApply', oSendObject);

              // {신청}되었습니다.
              MessageBox.alert(this.getBundleText('MSG_00007', 'LABEL_00121'), {
                onClose: () => {
                  this.onNavBack();
                },
              });
            } catch (oError) {
              AppUtils.handleError(oError);
            } finally {
              AppUtils.setAppBusy(false);
            }
          },
        });
      },

      // AttachFileTable Settings
      settingsAttachTable() {
        const oDetailModel = this.getViewModel();
        const sStatus = oDetailModel.getProperty('/FormData/ZappStatAl');
        const sAppno = oDetailModel.getProperty('/FormData/Appno') || '';

        AttachFileAction.setAttachFile(this, {
          Editable: !sStatus,
          Type: this.getApprovalType(),
          Appno: sAppno,
          Max: 10,
        });
      },
    });
  }
);
