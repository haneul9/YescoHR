/* eslint-disable no-useless-call */
sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/core/Fragment',
    'sap/ui/model/json/JSONModel',
    'sap/ui/yesco/control/MessageBox',
    'sap/ui/yesco/common/Appno',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/AttachFileAction',
    'sap/ui/yesco/common/ComboEntry',
    'sap/ui/yesco/common/FragmentEvent',
    'sap/ui/yesco/common/TextUtils',
    'sap/ui/yesco/common/TableUtils',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/common/exceptions/ODataReadError',
    'sap/ui/yesco/common/exceptions/ODataCreateError',
    'sap/ui/yesco/common/exceptions/ODataDeleteError',
    'sap/ui/yesco/mvc/controller/BaseController',
    'sap/ui/yesco/mvc/model/type/Date',
    'sap/ui/yesco/mvc/model/type/Currency',
  ],
  (
    // prettier 방지용 주석
    Fragment,
    JSONModel,
    MessageBox,
    Appno,
    AppUtils,
    AttachFileAction,
    ComboEntry,
    FragmentEvent,
    TextUtils,
    TableUtils,
    Client,
    ServiceNames,
    ODataReadError,
    ODataCreateError,
    ODataDeleteError,
    BaseController
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.healthCare.HealthCareDetail', {
      LIST_PAGE_ID: 'container-ehr---medical',
      DIALOG_FILE_ID: 'DialogAttFile',

      AttachFileAction: AttachFileAction,
      TextUtils: TextUtils,
      TableUtils: TableUtils,
      FragmentEvent: FragmentEvent,

      onBeforeShow() {
        const oViewModel = new JSONModel({
          Werks: this.getSessionProperty('Werks') !== '2000',
          menid: this.getCurrentMenuId(),
          Hass: this.isHass(),
          ViewKey: '',
          sYear: '',
          FormData: {},
          DialogData: {},
          TargetDetails: {},
          RemoveFiles: [],
          HisList: [],
          TargetList: [],
          ReceiptType: [],
          HisDeleteDatas: [],
          Settings: {},
          DialogLimit: false,
          listInfo: {
            rowCount: 1,
            totalCount: 0,
            progressCount: 0,
            applyCount: 0,
            approveCount: 0,
            rejectCount: 0,
            completeCount: 0,
          },
          busy: false,
        });
        this.setViewModel(oViewModel);

        this.getViewModel().setProperty('/busy', true);
      },

      async onObjectMatched(oParameter) {
        const sDataKey = oParameter.oDataKey;
        const oDetailModel = this.getViewModel();

        oDetailModel.setProperty('/ViewKey', sDataKey);

        try {
          const aAppList = await this.getTargetList();

          oDetailModel.setProperty('/TargetList', new ComboEntry({ codeKey: 'Kdsvh', valueKey: 'Znametx', aEntries: aAppList }));

          this.setFormData();
        } catch (oError) {
          this.debug(oError);
          AppUtils.handleError(oError);
        } finally {
          oDetailModel.setProperty('/busy', false);
        }
      },

      // override AttachFileCode
      getApprovalType() {
        return 'HR09';
      },

      getCurrentLocationText(oArguments) {
        const sAction = oArguments.oDataKey === 'N' ? this.getBundleText('LABEL_04002') : this.getBundleText('LABEL_00165');

        return sAction;
      },

      // FormData Settings
      async setFormData() {
        const oModel = this.getModel(ServiceNames.BENEFIT);
        const oDetailModel = this.getViewModel();
        const sViewKey = oDetailModel.getProperty('/ViewKey');
        const sWerks = this.getSessionProperty('Werks');
        let sMsg = '';

        if (sWerks === '2000') {
          sMsg = `<p>${this.getBundleText('MSG_09002')}</p>
            <p>${this.getBundleText('MSG_09003')}</p>
            <p>${this.getBundleText('MSG_09004')}</p>
            <p>${this.getBundleText('MSG_09005')}</p>
            <ul>
              <li>${this.getBundleText('MSG_09006')}
                <ul>
                  <li>${this.getBundleText('MSG_09007')}</li>
                  <li>${this.getBundleText('MSG_09008')}</li>
                  <li>${this.getBundleText('MSG_09009')}</li>
                  <li>${this.getBundleText('MSG_09010')}</li>
                  <li>${this.getBundleText('MSG_09011')}</li>
                  <li>${this.getBundleText('MSG_09012')}</li>
                  <li>${this.getBundleText('MSG_09013')}</li>
                  <li>${this.getBundleText('MSG_09014')}</li>
                </ul>
              </li>
            </ul>
            <p>${this.getBundleText('MSG_09015')}</p>`;
        } else if (sWerks === '1000' || sWerks === '4000') {
          sMsg = `<ol>
            <li>${this.getBundleText('MSG_09029')}</il>
            <li>${this.getBundleText('MSG_09030')}</il>
            <ul>
              <li>${this.getBundleText('MSG_09031')}</li>
              <li>${this.getBundleText('MSG_09032')}</li>
            </ul>
            <li>${this.getBundleText('MSG_09033')}</il>
            <li>${this.getBundleText('MSG_09034')}</il>
            <li>${this.getBundleText('MSG_09035')}</il>
            <ul>
              <li>${this.getBundleText('MSG_09036')}</li>
              <li>${this.getBundleText('MSG_09037')}</li>
              <li>${this.getBundleText('MSG_09038')}</li>
            </ul>
            <li>${this.getBundleText('MSG_09039')}</il>
            <ul>
              <li>${this.getBundleText('MSG_09040')}</li>
              ${this.getBundleText('MSG_09041')}
              <li>${this.getBundleText('MSG_09042')}</li>
              <li>${this.getBundleText('MSG_09043')}</li>
              <li>${this.getBundleText('MSG_09044')}</li>
              <li>${this.getBundleText('MSG_09045')}</li>
              <li>${this.getBundleText('MSG_09046')}</li>
              <li>${this.getBundleText('MSG_09047')}</li>
            </ul>
          </ol>`;
        } else if (sWerks === '3000') {
          sMsg = `<dl>
            <dt>${this.getBundleText('MSG_09002')}</dt>
            <dd>${this.getBundleText('MSG_09048')}</dd>
            <dt>${this.getBundleText('MSG_09004')}</dt>
            <br>
            <dt>${this.getBundleText('MSG_09005')}</dt>
            <dt>${this.getBundleText('LABEL_09025')}</dt>
              <dd>${this.getBundleText('MSG_09049')}</dd>
              <dd>${this.getBundleText('MSG_09050')}</dd>
              <dd>${this.getBundleText('MSG_09051')}</dd>
              <dd>${this.getBundleText('MSG_09052')}</dd>
            <dt>${this.getBundleText('LABEL_09026')}</dt>
              <dd>${this.getBundleText('MSG_09053')}</dd>
              <dd>${this.getBundleText('MSG_09054')}</dd>
              <dd>${this.getBundleText('MSG_09055')}</dd>
              <dd>${this.getBundleText('MSG_09056')}</dd>
              <dd>${this.getBundleText('MSG_09057')}</dd>
              <dd>${this.getBundleText('MSG_09058')}</dd>
              <dd>${this.getBundleText('MSG_09059')}</dd>
          </dl>`;
        }

        oDetailModel.setProperty('/InfoMessage', sMsg);

        const sYear = await this.getTotalYear();

        oDetailModel.setProperty('/sYear', sYear);

        if (sViewKey === 'N' || !sViewKey) {
          const mSessionData = this.getSessionData();

          oDetailModel.setProperty('/FormData', {
            Kdsvh: 'ALL',
            Apcnt: '0',
            Pvcnt: '0',
            Rjcnt: '0',
            Pyyea: sYear,
          });

          oDetailModel.setProperty('/ApplyInfo', {
            Apename: mSessionData.Ename,
            Aporgtx: `${mSessionData.Btrtx} / ${mSessionData.Orgtx}`,
            Apjikgbtl: `${mSessionData.Zzjikgbt} / ${mSessionData.Zzjikcht}`,
          });

          this.settingsAttachTable();
        } else {
          let oSendObject = {};

          oSendObject.Prcty = 'D';
          oSendObject.Appno = sViewKey;
          oSendObject.MedExpenseItemSet = [];

          oDetailModel.setProperty('/busy', true);

          oModel.create('/MedExpenseApplSet', oSendObject, {
            success: (oData) => {
              if (oData) {
                const oTargetData = oData;
                const aHisList = oData.MedExpenseItemSet.results;

                oDetailModel.setProperty('/FormData', oTargetData);
                oDetailModel.setProperty('/ApplyInfo', oTargetData);
                oDetailModel.setProperty('/TargetDetails', oTargetData);

                oDetailModel.setProperty('/HisList', aHisList);

                const iHisLength = aHisList.length;

                oDetailModel.setProperty('/listInfo', {
                  rowCount: iHisLength > 10 ? 10 : iHisLength,
                });

                this.getReceiptList(oTargetData.Famgb, oTargetData.Adult);
                oDetailModel.setProperty('/busy', false);
              }
              this.settingsAttachTable();
            },
            error: (oError) => {
              AppUtils.handleError(new ODataReadError(oError));
              oDetailModel.setProperty('/busy', false);
            },
          });
        }
      },

      getTotalYear() {
        const oModel = this.getModel(ServiceNames.BENEFIT);

        return new Promise((resolve, reject) => {
          oModel.read('/MedExpenseMymedSet', {
            filters: [],
            success: (oData) => {
              if (oData) {
                resolve(oData.results[0].Zyear);
              }
            },
            error: (oError) => {
              this.debug(oError);
              reject(new ODataReadError(oError));
            },
          });
        });
      },

      async getReceiptList(sKey, sAdult) {
        const oModel = this.getModel(ServiceNames.BENEFIT);
        const oDetailModel = this.getViewModel();
        const sWerks = this.getSessionProperty('Werks');
        const sViewKey = this.getViewModel().getProperty('/ViewKey');
        let sAppno = '';
        let sPyyea = '';

        if (!!sViewKey && sViewKey !== 'N') {
          const mFormData = oDetailModel.getProperty('/FormData');

          sAppno = mFormData.Appno;
          sKey = mFormData.Famgb;
          sAdult = mFormData.Adult;
          sPyyea = mFormData.Pyyea;
        } else {
          const aYearData = await Client.getEntitySet(oModel, 'MedExpenseMymed');

          sPyyea = aYearData[0].Zyear;
        }

        // 영수증구분
        oModel.read('/MedExpenseReceiptListSet', {
          filters: [new sap.ui.model.Filter('Adult', sap.ui.model.FilterOperator.EQ, sAdult), new sap.ui.model.Filter('Famgb', sap.ui.model.FilterOperator.EQ, sKey), new sap.ui.model.Filter('Werks', sap.ui.model.FilterOperator.EQ, sWerks), new sap.ui.model.Filter('Pyyea', sap.ui.model.FilterOperator.EQ, sPyyea), new sap.ui.model.Filter('Appno', sap.ui.model.FilterOperator.EQ, sAppno)],
          success: (oData) => {
            if (oData) {
              oDetailModel.setProperty('/ReceiptType', new ComboEntry({ codeKey: 'Zcode', valueKey: 'Ztext', aEntries: oData.results }));
            }
          },
          error: (oError) => {
            AppUtils.handleError(new ODataReadError(oError));
          },
        });
      },

      async getTargetList() {
        return new Promise((resolve, reject) => {
          const oModel = this.getModel(ServiceNames.BENEFIT);

          // 신청대상
          oModel.read('/MedExpenseSupportListSet', {
            filters: [new sap.ui.model.Filter('Datum', sap.ui.model.FilterOperator.EQ, new Date())],
            success: (oData) => {
              if (oData) {
                resolve(oData.results);
              }
            },
            error: (oError) => {
              reject(new ODataReadError(oError));
            },
          });
        });
      },

      // 신청대상 선택시
      async onTargetList(oEvent) {
        const oDetailModel = this.getViewModel();
        const sTargetPath = oEvent.getSource().getSelectedItem().getBindingContext().getPath();
        const mSelectedDetail = oDetailModel.getProperty(sTargetPath);

        oDetailModel.setProperty('/TargetDetails', mSelectedDetail);
        oDetailModel.setProperty('/FormData/Adult', mSelectedDetail.Adult);
        oDetailModel.setProperty('/FormData/Zname', mSelectedDetail.Zname);
        oDetailModel.setProperty('/FormData/Znametx', mSelectedDetail.Znametx);
        oDetailModel.setProperty('/FormData/Famsa', mSelectedDetail.Famsa);
        oDetailModel.setProperty('/FormData/Objps', mSelectedDetail.Objps);
        oDetailModel.setProperty('/FormData/Kdsvh', mSelectedDetail.Kdsvh);
        oDetailModel.setProperty('/FormData/Famgb', mSelectedDetail.Famgb);
        oDetailModel.setProperty('/FormData/Pratetx', mSelectedDetail.Pratetx);
        oDetailModel.setProperty('/FormData/Prate', mSelectedDetail.Prate);

        if (oEvent.getSource().getSelectedItem().getBindingContext().getPath().substr(-1) === '0') return;

        oDetailModel.setProperty('/HisList', []);
        oDetailModel.setProperty('/listInfo/rowCount', 0);
        this.getReceiptList(mSelectedDetail.Famgb, mSelectedDetail.Adult);
      },

      // 신청액 & 신청건수
      setAppAmount() {
        const oDetailModel = this.getViewModel();
        const aSumAmount = oDetailModel.getProperty('/HisList').map((a) => a.Bettot);

        if (!aSumAmount.length) return;

        const iAmount = aSumAmount.reduce((acc, cur) => {
          return parseInt(acc) + parseInt(cur);
        });

        oDetailModel.setProperty('/FormData/Apbet', String(iAmount));
        oDetailModel.setProperty('/FormData/Apcnt', String(aSumAmount.length));
      },

      // 상세내역 No
      addSeqnrNum() {
        const oDetailModel = this.getViewModel();
        const aHisList = oDetailModel.getProperty('/HisList');
        let iSeqnr = 0;

        aHisList.forEach((e) => {
          iSeqnr += 1;
          e.Seqnr = String(iSeqnr);
        });

        oDetailModel.setProperty('/HisList', aHisList);
      },

      checkError() {
        const oDetailModel = this.getViewModel();
        const mFormData = oDetailModel.getProperty('/FormData');

        // 신청대상
        if (mFormData.Kdsvh === 'ALL' || !mFormData.Kdsvh) {
          MessageBox.alert(this.getBundleText('MSG_09025'));
          return true;
        }

        // 비고
        if (!mFormData.Zbigo) {
          MessageBox.alert(this.getBundleText('MSG_09026'));
          return true;
        }

        const aHisList = oDetailModel.getProperty('/HisList');

        // 상세내역
        if (!aHisList.length) {
          MessageBox.alert(this.getBundleText('MSG_09027'));
          return true;
        }

        // 첨부파일
        const bResult = aHisList.every((e) => e.Attyn === 'X');

        if (!bResult && !AttachFileAction.getFileCount.call(this)) {
          MessageBox.alert(this.getBundleText('MSG_09028'));
          return true;
        }

        return false;
      },
      // 재작성
      onRewriteBtn() {
        const oDetailModel = this.getViewModel();

        oDetailModel.setProperty('/FormData/Appno', '');
        oDetailModel.setProperty('/FormData/Lnsta', '');
        this.settingsAttachTable();
      },

      // 임시저장
      onSaveBtn() {
        const oModel = this.getModel(ServiceNames.BENEFIT);
        const oDetailModel = this.getViewModel();
        const sAppno = oDetailModel.getProperty('/FormData/Appno');
        const mFormData = oDetailModel.getProperty('/FormData');

        if (this.checkError()) return;

        MessageBox.confirm(this.getBundleText('MSG_00006', 'LABEL_00103'), {
          title: this.getBundleText('LABEL_09010'),
          actions: [this.getBundleText('LABEL_00103'), this.getBundleText('LABEL_00118')],
          onClose: async (vPress) => {
            if (vPress && vPress === this.getBundleText('LABEL_00103')) {
              try {
                AppUtils.setAppBusy(true, this);

                if (!sAppno) {
                  const sAppno = await Appno.get.call(this);

                  oDetailModel.setProperty('/FormData/Appno', sAppno);
                  oDetailModel.setProperty('/FormData/Appda', new Date());
                }

                let oSendObject = {};

                oSendObject = mFormData;
                oSendObject.Prcty = 'T';
                oSendObject.Menid = oDetailModel.getProperty('/menid');
                oSendObject.Waers = 'KRW';
                oSendObject.MedExpenseItemSet = oDetailModel.getProperty('/HisList');
                // FileUpload
                if (!!AttachFileAction.getFileCount.call(this)) {
                  await AttachFileAction.uploadFile.call(this, mFormData.Appno, this.getApprovalType());
                }

                const aHislist = oDetailModel.getProperty('/HisList');

                if (!!aHislist.length && !!this.byId('DetailHisDialog')) {
                  await aHislist.forEach((e) => {
                    AttachFileAction.uploadFile.call(this, e.Appno2, this.getApprovalType(), this.DIALOG_FILE_ID);
                  });
                }

                const aDeleteDatas = oDetailModel.getProperty('/RemoveFiles');

                if (!!aDeleteDatas.length) {
                  await aDeleteDatas.forEach((e) => {
                    AttachFileAction.deleteFile(e.Appno2, this.getApprovalType());
                  });
                }

                await new Promise((resolve, reject) => {
                  oModel.create('/MedExpenseApplSet', oSendObject, {
                    success: () => {
                      resolve();
                    },
                    error: (oError) => {
                      reject(new ODataCreateError({ oError }));
                    },
                  });
                });

                MessageBox.alert(this.getBundleText('MSG_00007', 'LABEL_00103'));
              } catch (oError) {
                AppUtils.handleError(oError);
              } finally {
                AppUtils.setAppBusy(false, this);
              }
            }
          },
        });
      },

      // 신청
      onApplyBtn() {
        const oModel = this.getModel(ServiceNames.BENEFIT);
        const oDetailModel = this.getViewModel();
        const sAppno = oDetailModel.getProperty('/FormData/Appno');
        const mFormData = oDetailModel.getProperty('/FormData');

        if (this.checkError()) return;

        MessageBox.confirm(this.getBundleText('MSG_00006', 'LABEL_00121'), {
          title: this.getBundleText('LABEL_09010'),
          actions: [this.getBundleText('LABEL_00121'), this.getBundleText('LABEL_00118')],
          onClose: async (vPress) => {
            if (vPress && vPress === this.getBundleText('LABEL_00121')) {
              try {
                AppUtils.setAppBusy(true, this);

                if (!sAppno) {
                  const sAppno = await Appno.get.call(this);

                  oDetailModel.setProperty('/FormData/Appno', sAppno);
                  oDetailModel.setProperty('/FormData/Appda', new Date());
                }

                let oSendObject = {};

                oSendObject = mFormData;
                oSendObject.Prcty = 'C';
                oSendObject.Menid = oDetailModel.getProperty('/menid');
                oSendObject.Waers = 'KRW';
                oSendObject.MedExpenseItemSet = oDetailModel.getProperty('/HisList');

                // FileUpload
                if (!!AttachFileAction.getFileCount.call(this)) {
                  await AttachFileAction.uploadFile.call(this, mFormData.Appno, this.getApprovalType());
                }

                const aHislist = oDetailModel.getProperty('/HisList');

                if (!!aHislist.length && !!this.byId('DetailHisDialog')) {
                  await aHislist.forEach((e) => {
                    AttachFileAction.uploadFile.call(this, e.Appno2, this.getApprovalType(), this.DIALOG_FILE_ID);
                  });
                }

                const aDeleteDatas = oDetailModel.getProperty('/RemoveFiles');

                if (!!aDeleteDatas.length) {
                  await aDeleteDatas.forEach((e) => {
                    AttachFileAction.deleteFile(e.Appno2, this.getApprovalType());
                  });
                }

                await new Promise((resolve, reject) => {
                  oModel.create('/MedExpenseApplSet', oSendObject, {
                    success: () => {
                      resolve();
                    },
                    error: (oError) => {
                      reject(new ODataCreateError({ oError }));
                    },
                  });
                });

                MessageBox.alert(this.getBundleText('MSG_00007', 'LABEL_00121'), {
                  onClose: () => {
                    this.onNavBack();
                  },
                });
              } catch (oError) {
                AppUtils.handleError(oError);
              } finally {
                AppUtils.setAppBusy(false, this);
              }
            }
          },
        });
      },

      // 취소
      onCancelBtn() {
        const oModel = this.getModel(ServiceNames.BENEFIT);
        const oDetailModel = this.getViewModel();

        MessageBox.confirm(this.getBundleText('MSG_00006', 'LABEL_00118'), {
          title: this.getBundleText('LABEL_09010'),
          actions: [this.getBundleText('LABEL_00114'), this.getBundleText('LABEL_00118')],
          onClose: (vPress) => {
            if (vPress && vPress === this.getBundleText('LABEL_00114')) {
              AppUtils.setAppBusy(true, this);

              let oSendObject = {};

              oSendObject = oDetailModel.getProperty('/FormData');
              oSendObject.Prcty = 'W';
              oSendObject.Menid = oDetailModel.getProperty('/menid');

              oModel.create('/MedExpenseApplSet', oSendObject, {
                success: () => {
                  AppUtils.setAppBusy(false, this);
                  MessageBox.alert(this.getBundleText('MSG_00039', 'LABEL_00121'), {
                    onClose: () => {
                      this.onNavBack();
                    },
                  });
                },
                error: (oError) => {
                  AppUtils.handleError(new ODataCreateError({ oError }));
                  AppUtils.setAppBusy(false, this);
                },
              });
            }
          },
        });
      },

      // 삭제
      onDeleteBtn() {
        const oModel = this.getModel(ServiceNames.BENEFIT);
        const oDetailModel = this.getViewModel();

        MessageBox.confirm(this.getBundleText('MSG_00006', 'LABEL_00110'), {
          title: this.getBundleText('LABEL_09010'),
          actions: [this.getBundleText('LABEL_00110'), this.getBundleText('LABEL_00118')],
          onClose: (vPress) => {
            if (vPress && vPress === this.getBundleText('LABEL_00110')) {
              AppUtils.setAppBusy(true, this);

              const sPath = oModel.createKey('/MedExpenseApplSet', {
                Appno: oDetailModel.getProperty('/FormData/Appno'),
              });

              oModel.remove(sPath, {
                success: () => {
                  AppUtils.setAppBusy(false, this);
                  MessageBox.alert(this.getBundleText('MSG_00007', 'LABEL_00110'), {
                    onClose: () => {
                      this.onNavBack();
                    },
                  });
                },
                error: (oError) => {
                  AppUtils.handleError(new ODataDeleteError(oError));
                  AppUtils.setAppBusy(false, this);
                },
              });
            }
          },
        });
      },

      // 상세내역 추가
      onAddDetails() {
        const oDetailModel = this.getViewModel();
        const sAppTarget = oDetailModel.getProperty('/FormData/Kdsvh');

        if (!sAppTarget || sAppTarget === 'ALL') {
          return MessageBox.alert(this.getBundleText('MSG_09023'));
        }

        oDetailModel.setProperty('/DialogData', []);

        this.setDialogData();

        if (!this.byId('DetailHisDialog')) {
          Fragment.load({
            id: this.getView().getId(),
            name: 'sap.ui.yesco.mvc.view.medical.fragment.DetailHisDialog',
            controller: this,
          }).then((oDialog) => {
            // connect dialog to the root view of this component (models, lifecycle)
            this.getView().addDependent(oDialog);
            oDialog.addStyleClass(this.getOwnerComponent().getContentDensityClass());
            this.settingsAttachDialog();

            oDialog.open();
          });
        } else {
          this.settingsAttachDialog();
          this.byId('DetailHisDialog').open();
        }
      },

      // 상세내역 삭제
      onDelDetails() {
        const oDetailModel = this.getViewModel();
        const aDeleteDatas = oDetailModel.getProperty('/HisDeleteDatas');

        if (!aDeleteDatas.length) {
          return MessageBox.alert(this.getBundleText('MSG_00020', 'LABEL_00110'));
        }

        oDetailModel.setProperty('/RemoveFiles', aDeleteDatas);
        const aHisList = oDetailModel.getProperty('/HisList');
        const aNoInclued = aHisList.filter((e) => !aDeleteDatas.includes(e));
        const oHisTable = this.byId('medHisTable');

        oDetailModel.setProperty('/HisList', aNoInclued);
        oDetailModel.setProperty('/listInfo/rowCount', aNoInclued.length);
        oHisTable.clearSelection();
        this.setAppAmount();
        this.addSeqnrNum();
      },

      // AttachFileTable Settings
      settingsAttachTable() {
        const oDetailModel = this.getViewModel();
        const sStatus = oDetailModel.getProperty('/FormData/Lnsta');
        const sAppno = oDetailModel.getProperty('/FormData/Appno') || '';

        AttachFileAction.setAttachFile(this, {
          Editable: !sStatus || sStatus === '10',
          Type: this.getApprovalType(),
          Appno: sAppno,
          Max: 10,
          FileTypes: ['jpg', 'pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'bmp', 'png'],
        });
      },

      /*
       *******************************************************************************************
       *****************************DialogEvent***************************************************
       */

      // 진료내역 check
      checkClinicDetail() {
        const oDetailModel = this.getViewModel();
        const mDialogData = oDetailModel.getProperty('/DialogData');

        // 진료기간
        if (!mDialogData.Begda) {
          MessageBox.alert(this.getBundleText('MSG_09018'));
          return true;
        }

        // 병명/진료과목
        if (!mDialogData.Disenm) {
          MessageBox.alert(this.getBundleText('MSG_09019'));
          return true;
        }

        // 의료기관명
        if (!mDialogData.Medorg) {
          MessageBox.alert(this.getBundleText('MSG_09020'));
          return true;
        }

        // 영수증 구분
        if (!mDialogData.Recpgb || mDialogData.Recpgb === 'ALL') {
          MessageBox.alert(this.getBundleText('MSG_09021'));
          return true;
        }

        // 금여 or 비급여
        if (!mDialogData.Bet01 && !mDialogData.Bet02) {
          MessageBox.alert(this.getBundleText('MSG_09022'));
          return true;
        }

        // 금여 or 비급여 한도체크
        if (oDetailModel.getProperty('/DialogLimit')) {
          MessageBox.alert(this.getBundleText('MSG_09024'));
          return true;
        }

        const mReciptDetails = oDetailModel.getProperty('/ReciptDetails');
        const mTargetDetails = oDetailModel.getProperty('/TargetDetails');

        if (!!mReciptDetails) {
          // 급여인경우
          if (!!mDialogData.Bet01) {
            const iBet01 = parseInt(mReciptDetails.Bet01);
            const iActCost = parseInt(mDialogData.Bet01) * parseFloat(mTargetDetails.Prate);

            if (iBet01 < iActCost) {
              MessageBox.alert(this.getBundleText('MSG_09017', mReciptDetails.Bet01Basic, this.TextUtils.toCurrency(parseInt(iBet01 / parseFloat(mTargetDetails.Prate)))));
              return true;
            }
          }

          if (!!mDialogData.Bet02) {
            const iBet02 = parseInt(mReciptDetails.Bet02);
            const sAddBet02 = mReciptDetails.Bet02Add;
            const iActCost = parseInt(mDialogData.Bet02) * parseFloat(mTargetDetails.Prate);

            if ((sAddBet02 === '0' || !sAddBet02) && !mReciptDetails.Bet02AddChk) {
              if (iBet02 < iActCost) {
                // 비급여 추가한도를 초과했을경우
                MessageBox.alert(this.getBundleText('MSG_09017', mReciptDetails.Bet02Basic, this.TextUtils.toCurrency(parseInt(iBet02 / parseFloat(mTargetDetails.Prate)))));
                return true;
              }
            } else {
              const iAddBet02 = parseInt(sAddBet02);

              if (iAddBet02 < iActCost) {
                // 비급여 한도를 초과했을경우
                MessageBox.alert(this.getBundleText('MSG_09017', mReciptDetails.Bet02AddBasic, this.TextUtils.toCurrency(parseInt(iAddBet02 / parseFloat(mTargetDetails.Prate)))));
                return true;
              }
            }
          }
        }

        // 인사영역 2000번일경우는 첨부파일 필수
        if (this.getAppointeeProperty('Werks') === '2000' && !this.getViewModel(this.DIALOG_FILE_ID).getProperty('/Data').length) {
          MessageBox.alert(this.getBundleText('MSG_00046'));
          return true;
        }

        return false;
      },

      checkedDialogData(sType) {
        const oModel = this.getModel(ServiceNames.BENEFIT);
        const oDetailModel = this.getViewModel();
        const mFormData = oDetailModel.getProperty('/FormData');
        const aHisList = oDetailModel.getProperty('/HisList');
        const aDetailList = [];

        if (sType === 'C') {
          aDetailList.push(oDetailModel.getProperty('/DialogData'), ...aHisList);
        } else {
          aDetailList.push(...aHisList);
        }

        let oSendObject = {};

        aDetailList.forEach((e) => {
          e.Waers = 'KRW';
        });

        oSendObject = mFormData;
        oSendObject.Prcty = '1';
        oSendObject.MedExpenseItemSet = aDetailList;

        return new Promise((resolve, reject) => {
          oModel.create('/MedExpenseApplSet', oSendObject, {
            success: () => {
              resolve(true);
            },
            error: (oError) => {
              reject(new ODataCreateError({ oError }));
            },
          });
        });
      },

      // Dialog 등록
      async onHisRegBtn() {
        const oDetailModel = this.getViewModel();
        const mDialogData = oDetailModel.getProperty('/DialogData');
        const oTable = this.byId('medHisTable');

        if (this.checkClinicDetail()) return;

        try {
          AppUtils.setAppBusy(true, this);

          if (!mDialogData.Appno2 || mDialogData.Appno2 === '00000000000000') {
            const vAppno = await Appno.get.call(this);

            oDetailModel.setProperty('/DialogData/Appno2', vAppno);
          }

          mDialogData.Waers = 'KRW';

          const aHisList = [mDialogData, ...oDetailModel.getProperty('/HisList')];
          const aDetail = [];

          aHisList.forEach((e) => {
            if (e.Appno2 === mDialogData.Appno2) {
              e.Line = 'X';
            } else {
              e.Line = '';
            }
            aDetail.push(e);
          });

          await this.checkedDialogData('C');

          oDetailModel.setProperty('/HisList', aDetail);
          oDetailModel.setProperty('/listInfo', TableUtils.count({ oTable, aRowData: aHisList, sStatCode: 'ZappStat' }));

          this.setAppAmount();
          this.addSeqnrNum();

          await AttachFileAction.uploadFile.call(this, mDialogData.Appno2, this.getApprovalType(), this.DIALOG_FILE_ID);

          const oDialogModel = this.getViewModel(this.DIALOG_FILE_ID);
          let bFile = '';

          if (!!oDialogModel.getProperty('/DeleteDatas').length) {
            bFile = '';
          }

          if (!!oDialogModel.getProperty('/Data').length) {
            bFile = 'X';
          }

          oDetailModel.setProperty('/DialogData/Attyn', bFile);
          this.byId('DetailHisDialog').close();
        } catch (oError) {
          AppUtils.handleError(oError);
        } finally {
          AppUtils.setAppBusy(false, this);
        }
      },

      // Dialog 수정
      async onHisUpBtn() {
        const oDetailModel = this.getViewModel();
        const mDialogData = oDetailModel.getProperty('/DialogData');
        const aHisList = oDetailModel.getProperty('/HisList');

        if (this.checkClinicDetail()) return;

        try {
          AppUtils.setAppBusy(true, this);

          if (!mDialogData.Appno2 || mDialogData.Appno2 === '00000000000000') {
            const vAppno = await Appno.get.call(this);

            oDetailModel.setProperty('/DialogData/Appno2', vAppno);
          }

          const aDetail = [];

          aHisList.forEach((e) => {
            if (e.Appno2 === mDialogData.Appno2) {
              e.Line = 'X';
            } else {
              e.Line = '';
            }
            aDetail.push(e);
          });

          oDetailModel.setProperty('/HisList', aDetail);

          await this.checkedDialogData();

          // aHisList.forEach((e, i) => {
          //   if (mDialogData.Seqnr === e.Seqnr) {
          //     oDetailModel.setProperty(`/HisList/${i}`, mDialogData);
          //   }
          // });

          await AttachFileAction.uploadFile.call(this, mDialogData.Appno2, this.getApprovalType(), this.DIALOG_FILE_ID);

          const oDialogModel = this.getViewModel(this.DIALOG_FILE_ID);

          let bFile = '';

          if (!!oDialogModel.getProperty('/DeleteDatas').length) {
            bFile = '';
          }

          if (!!oDialogModel.getProperty('/Data').length) {
            bFile = 'X';
          }

          oDetailModel.setProperty('/DialogData/Attyn', bFile);
          this.setAppAmount();
          this.byId('DetailHisDialog').close();
        } catch (oError) {
          AppUtils.handleError(oError);
        } finally {
          AppUtils.setAppBusy(false, this);
        }
      },

      // Dialog Close
      onDialogClose(oEvent) {
        this.byId('DetailHisDialog').close();
      },

      // 급여 , 비급여 한도 비교
      liveCompar(oEvent) {
        const oEventSource = oEvent.getSource();
        const sPath = oEventSource.getBinding('value').getPath();
        const sValue = oEvent.getParameter('value').trim().replace(/[^\d]/g, '');
        const oDetailModel = this.getViewModel();
        const mReciptDetails = oDetailModel.getProperty('/ReciptDetails');
        const mTargetDetails = oDetailModel.getProperty('/TargetDetails');
        const iValue = parseInt(sValue);
        const iActCost = iValue * parseFloat(mTargetDetails.Prate);
        let sAmount = sValue;

        oDetailModel.setProperty('/DialogLimit', false);

        if (!!mReciptDetails) {
          // 급여인경우
          if (sPath === '/DialogData/Bet01') {
            const iBet01 = parseInt(mReciptDetails.Bet01);

            if (iBet01 < iActCost) {
              MessageBox.alert(this.getBundleText('MSG_09017', mReciptDetails.Bet01Basic, this.TextUtils.toCurrency(parseInt(iBet01 / parseFloat(mTargetDetails.Prate)))));
              oDetailModel.setProperty('/DialogLimit', true);
            }
          } else {
            const iBet02 = parseInt(mReciptDetails.Bet02);
            const sAddBet02 = mReciptDetails.Bet02Add;

            if ((sAddBet02 === '0' || !sAddBet02) && !mReciptDetails.Bet02AddChk) {
              if (iBet02 < iActCost) {
                // 비급여 추가한도를 초과했을경우
                MessageBox.alert(this.getBundleText('MSG_09017', mReciptDetails.Bet02Basic, this.TextUtils.toCurrency(parseInt(iBet02 / parseFloat(mTargetDetails.Prate)))));
                oDetailModel.setProperty('/DialogLimit', true);
              }
            } else {
              const iAddBet02 = parseInt(sAddBet02);

              if (iAddBet02 < iActCost) {
                // 비급여 한도를 초과했을경우
                MessageBox.alert(this.getBundleText('MSG_09017', mReciptDetails.Bet02AddBasic, this.TextUtils.toCurrency(parseInt(iAddBet02 / parseFloat(mTargetDetails.Prate)))));
                oDetailModel.setProperty('/DialogLimit', true);
              }
            }
          }
        }

        oEventSource.setValue(this.TextUtils.toCurrency(sAmount));
        oDetailModel.setProperty(sPath, !sAmount ? '0' : sAmount);

        setTimeout(() => {
          const mDialogData = oDetailModel.getProperty('/DialogData');
          const iBet01 = parseInt(mDialogData.Bet01) || 0;
          const iBet02 = parseInt(mDialogData.Bet02) || 0;

          oDetailModel.setProperty('/DialogData/Bettot', String(iBet01 + iBet02));
        }, 100);
      },

      // 상세내역 Click
      onDetailsRow(oEvent) {
        const vPath = oEvent.getParameter('rowBindingContext').getPath();
        const oDetailModel = this.getViewModel();
        const oRowData = oDetailModel.getProperty(vPath);

        if (!!oRowData.Lnsta && oRowData.Lnsta !== '10') return;

        this.setDialogData(oRowData);

        if (!this.byId('DetailHisDialog')) {
          Fragment.load({
            id: this.getView().getId(),
            name: 'sap.ui.yesco.mvc.view.medical.fragment.DetailHisDialog',
            controller: this,
          }).then((oDialog) => {
            // connect dialog to the root view of this component (models, lifecycle)
            this.getView().addDependent(oDialog);
            oDialog.addStyleClass(this.getOwnerComponent().getContentDensityClass());
            this.settingsAttachDialog();

            oDialog.open();
          });
        } else {
          this.settingsAttachDialog();
          this.byId('DetailHisDialog').open();
        }
      },

      // 상세내역Table checkbox
      onRowSelection(oEvent) {
        const aSelected = oEvent.getSource().getSelectedIndices();
        const oDetailModel = this.getViewModel();

        if (!aSelected) return;

        const aDeleteDatas = [];

        oDetailModel.setProperty('/HisDeleteDatas', []);

        aSelected.forEach((e) => {
          aDeleteDatas.push(oDetailModel.getProperty(`/HisList/${e}`));
        });

        oDetailModel.setProperty('/HisDeleteDatas', aDeleteDatas);
      },

      // 영수증 구분선택시 데이터 셋팅
      onRecipt(oEvent) {
        const sKey = oEvent.getSource().getSelectedKey();
        const oDetailModel = this.getViewModel();

        oDetailModel.getProperty('/ReceiptType').forEach((e) => {
          if (sKey === e.Zcode) {
            oDetailModel.setProperty('/ReciptDetails', e);
            oDetailModel.setProperty('/DialogData/Recpgbtx', e.Ztext);
          }
        });
      },

      // Dialog SettingData
      async setDialogData(mRowData) {
        const oDetailModel = this.getViewModel();

        if (!mRowData) {
          oDetailModel.setProperty('/DialogData', {
            Recpgb: 'ALL',
            Pratetx: oDetailModel.getProperty('/FormData/Pratetx'),
            Prate: oDetailModel.getProperty('/FormData/Prate'),
            Pybet: '0',
            isNew: true,
          });
        } else {
          oDetailModel.setProperty('/DialogData', mRowData);
          oDetailModel.setProperty('/DialogData/isNew', false);
        }

        const iYear = parseInt(oDetailModel.getProperty('/sYear'));

        oDetailModel.setProperty('/DialogData/minDate', new Date(iYear, 0, 1));
        oDetailModel.setProperty('/DialogData/maxDate', new Date(iYear, 12, 0));
      },

      // Dialog AttachFileTable Settings
      settingsAttachDialog() {
        const oDetailModel = this.getViewModel();
        const sAppno = oDetailModel.getProperty('/DialogData/Appno2') || '';

        AttachFileAction.setAttachFile(this, {
          Id: this.DIALOG_FILE_ID,
          Type: this.getApprovalType(),
          Editable: true,
          Appno: sAppno,
          Max: 1,
          FileTypes: ['jpg', 'pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'bmp', 'png'],
        });
      },
    });
  }
);