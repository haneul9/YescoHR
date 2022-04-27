/* eslint-disable no-useless-call */
sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/yesco/control/MessageBox',
    'sap/ui/yesco/common/Appno',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/AttachFileAction',
    'sap/ui/yesco/common/exceptions/UI5Error',
    'sap/ui/yesco/common/TableUtils',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/mvc/controller/BaseController',
  ],
  (
    // prettier 방지용 주석
    MessageBox,
    Appno,
    AppUtils,
    AttachFileAction,
    UI5Error,
    TableUtils,
    Client,
    ServiceNames,
    BaseController
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.commuteType.CommuteTypeDetail', {
      LIST_PAGE_ID: { E: 'container-ehr---commuteType', H: 'container-ehr---h_commuteType' },

      AttachFileAction: AttachFileAction,
      TableUtils: TableUtils,

      initializeModel() {
        return {
          previousName: '',
          FormData: {},
          Settings: {},
          WorkType: [],
          busy: false,
        };
      },

      // setData
      async onObjectMatched(oParameter, sRouteName) {
        const oViewModel = this.getViewModel();

        oViewModel.setData(this.initializeModel());
        oViewModel.setProperty('/previousName', _.chain(sRouteName).split('-', 1).head().value());

        try {
          // Input Field Imited
          oViewModel.setProperty('/FieldLimit', _.assignIn(this.getEntityLimit(ServiceNames.WORKTIME, 'WorkScheduleApply')));
          oViewModel.setProperty('/busy', true);

          const sPernr = this.getAppointeeProperty('Pernr');
          const oModel = this.getModel(ServiceNames.WORKTIME);
          // 대상자리스트
          const aOtpList = await Client.getEntitySet(oModel, 'SchkzList', {
            Pernr: sPernr,
          });

          oViewModel.setProperty('/WorkType', aOtpList);

          const sDataKey = oParameter.oDataKey;

          if (sDataKey === 'N' || !sDataKey) {
            const oView = this.getView();
            const oListView = oView.getParent().getPage(this.isHass() ? this.LIST_PAGE_ID.H : this.LIST_PAGE_ID.E);
            const [oTargetData] = oListView.getModel().getProperty('/SelectedRow');
            const sZyymm = oParameter.zyymm;
            const sSchkz = oParameter.schkz;

            oViewModel.setProperty('/FormData', {
              Appno: oTargetData.Appno,
              Pernr: sPernr,
              Zyymm: sZyymm,
              Schkz: sSchkz,
            });
            oViewModel.setProperty('/ApplyInfo', oTargetData);
            oViewModel.setProperty('/ApprovalDetails', oTargetData);
          }

          this.settingsAttachTable();
        } catch (oError) {
          if (oError instanceof Error) oError = new UI5Error({ message: this.getBundleText('MSG_00043') }); // 잘못된 접근입니다.

          this.debug(oError);
          AppUtils.handleError(oError, {
            onClose: () => {
              this.getRouter().navTo(oViewModel.getProperty('/previousName'));
            },
          });
        } finally {
          oViewModel.setProperty('/busy', false);
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

              const oViewModel = this.getViewModel();
              const sAppno = oViewModel.getProperty('/FormData/Appno');

              if (!sAppno || _.parseInt(sAppno) === 0) {
                const sAppno = await Appno.get.call(this);

                oViewModel.setProperty('/FormData/Appno', sAppno);
                oViewModel.setProperty('/FormData/Appda', new Date());
              }

              const oModel = this.getModel(ServiceNames.WORKTIME);
              const oFormData = oViewModel.getProperty('/FormData');
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
        const oViewModel = this.getViewModel();
        const sStatus = oViewModel.getProperty('/FormData/ZappStatAl');
        const sAppno = oViewModel.getProperty('/FormData/Appno') || '';

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
