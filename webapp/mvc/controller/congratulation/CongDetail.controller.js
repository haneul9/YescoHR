sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/core/Fragment',
    'sap/ui/model/json/JSONModel',
    'sap/ui/yesco/common/Appno',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/AttachFileAction',
    'sap/ui/yesco/common/ComboEntry',
    'sap/ui/yesco/common/EmpInfo',
    'sap/ui/yesco/common/TextUtils',
    'sap/ui/yesco/common/FragmentEvent',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/control/MessageBox',
    'sap/ui/yesco/mvc/controller/BaseController',
  ],
  (
    // prettier 방지용 주석
    Fragment,
    JSONModel,
    Appno,
    AppUtils,
    AttachFileAction,
    ComboEntry,
    EmpInfo,
    TextUtils,
    FragmentEvent,
    ServiceNames,
    MessageBox,
    BaseController
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.congratulation.CongDetail', {
      TYPE_CODE: 'HR01',

      AttachFileAction: AttachFileAction,
      FragmentEvent: FragmentEvent,
      TextUtils: TextUtils,

      onBeforeShow() {
        const oViewModel = new JSONModel({
          FormStatus: '',
          FormData: {},
          Settings: {},
          BenefitType: [],
          BenefitCause: [],
          BenefitRelation: [],
          busy: false,
        });
        this.setViewModel(oViewModel);

        this.getViewModel().setProperty('/busy', true);
        EmpInfo.get.call(this);
        this.getRouter().getRoute('congratulation-detail').attachPatternMatched(this.onObjectMatched, this);
      },

      async onAfterShow() {
        await this.getBenefitType(this);
        await this.getTargetData();
        this.getViewModel().setProperty('/busy', false);
        this.onPageLoaded();
      },

      onObjectMatched(mArgs) {
        this.getViewModel().setProperty('/FormStatus', mArgs.oDataKey);
      },

      formatFlowerTxt(vFlower) {
        return vFlower === undefined ? '' : vFlower === 'X' ? 'Y' : 'N';
      },

      // 상세조회
      getTargetData() {
        const oDetailModel = this.getViewModel();
        const sDataKey = oDetailModel.getProperty('/FormStatus');

        return new Promise((resolve) => {
          if (!sDataKey || sDataKey === 'N') {
            const oTargetInfo = oDetailModel.getProperty('/TargetInfo');

            oDetailModel.setProperty('/FormData', oTargetInfo);
            oDetailModel.setProperty('/FormData', {
              Apename: oTargetInfo.Ename,
              Appernr: oTargetInfo.Pernr,
              Concode: 'ALL',
              Conresn: 'ALL',
              Kdsvh: 'ALL',
            });

            oDetailModel.setProperty('/ApplyInfo', {
              Apename: oTargetInfo.Ename,
              Orgtx: `${oTargetInfo.Btrtx}/${oTargetInfo.Orgtx}`,
              Apjikgbtl: `${oTargetInfo.Zzjikgbt}/${oTargetInfo.Zzjiktlt}`,
            });

            resolve();
          } else {
            const oModel = this.getModel(ServiceNames.BENEFIT);
            const sUrl = '/ConExpenseApplSet';

            oModel.read(sUrl, {
              filters: [
                new sap.ui.model.Filter('Prcty', sap.ui.model.FilterOperator.EQ, 'D'),
                new sap.ui.model.Filter('Actty', sap.ui.model.FilterOperator.EQ, 'E'),
                new sap.ui.model.Filter('Appno', sap.ui.model.FilterOperator.EQ, sDataKey),
              ],
              success: (oData) => {
                if (oData) {
                  this.debug(`${sUrl} success.`, oData);
                  const oTargetData = oData.results[0];

                  oDetailModel.setProperty('/FormData', oTargetData);
                  oDetailModel.setProperty('/ApplyInfo', oTargetData);
                  oDetailModel.setProperty('/ApprovalDetails', oTargetData);
                }

                this.getBenefitData();
                resolve();
              },
              error: (oError) => {
                const vErrorMSG = AppUtils.parseError(oError);

                MessageBox.error(vErrorMSG);
              },
            });
          }
        }).then(() => {
          this.settingsAttachTable(this);
        });
      },

      // 경조유형
      getBenefitType() {
        const oModel = this.getModel(ServiceNames.BENEFIT);
        const oDetailModel = this.getViewModel();
        const oTargetData = oDetailModel.getProperty('/TargetInfo');

        return new Promise((resolve) => {
          oModel.read('/BenefitCodeListSet', {
            filters: [
              new sap.ui.model.Filter('Cdnum', sap.ui.model.FilterOperator.EQ, 'BE0001'),
              new sap.ui.model.Filter('Werks', sap.ui.model.FilterOperator.EQ, oTargetData.Werks),
              new sap.ui.model.Filter('Datum', sap.ui.model.FilterOperator.EQ, new Date()),
            ],
            success: (oData) => {
              if (oData) {
                const aList = oData.results;

                oDetailModel.setProperty('/BenefitType', new ComboEntry({ codeKey: 'Zcode', valueKey: 'Ztext', mEntries: aList }));
                oDetailModel.setProperty('/BenefitCause', new ComboEntry({ codeKey: 'Zcode', valueKey: 'Ztext' }));
                oDetailModel.setProperty('/BenefitRelation', new ComboEntry({ codeKey: 'Zcode', valueKey: 'Ztext' }));
              }
              resolve();
            },
            error: (oError) => {
              const vErrorMSG = AppUtils.parseError(oError);

              MessageBox.error(vErrorMSG);
            },
          });
        });
      },

      // 전체list에 맞는코드 조회
      getBenefitData() {
        const oModel = this.getModel(ServiceNames.BENEFIT);
        const oDetailModel = this.getViewModel();
        const oFormData = oDetailModel.getProperty('/FormData');

        oModel.read('/BenefitCodeListSet', {
          filters: [
            new sap.ui.model.Filter('Cdnum', sap.ui.model.FilterOperator.EQ, 'BE0002'),
            new sap.ui.model.Filter('Werks', sap.ui.model.FilterOperator.EQ, oDetailModel.getProperty('/TargetInfo/Werks')),
            new sap.ui.model.Filter('Datum', sap.ui.model.FilterOperator.EQ, new Date()),
            new sap.ui.model.Filter('Upcod', sap.ui.model.FilterOperator.EQ, oFormData.Concode),
            new sap.ui.model.Filter('Upcod2', sap.ui.model.FilterOperator.EQ, 'E'),
          ],
          success: (oData) => {
            if (oData) {
              const aList = oData.results;

              oDetailModel.setProperty('/BenefitCause', new ComboEntry({ codeKey: 'Zcode', valueKey: 'Ztext', mEntries: aList }));
            }
          },
          error: (oError) => {
            const vErrorMSG = AppUtils.parseError(oError);

            MessageBox.error(vErrorMSG);
          },
        });

        oModel.read('/BenefitCodeListSet', {
          filters: [
            new sap.ui.model.Filter('Cdnum', sap.ui.model.FilterOperator.EQ, 'BE0003'),
            new sap.ui.model.Filter('Werks', sap.ui.model.FilterOperator.EQ, oDetailModel.getProperty('/TargetInfo/Werks')),
            new sap.ui.model.Filter('Datum', sap.ui.model.FilterOperator.EQ, new Date()),
            new sap.ui.model.Filter('Upcod', sap.ui.model.FilterOperator.EQ, oFormData.Concode),
            new sap.ui.model.Filter('Upcod2', sap.ui.model.FilterOperator.EQ, oFormData.Conresn),
          ],
          success: (oData) => {
            if (oData) {
              const oResult = oData.results;
              const oRelationBtn = this.byId('RelationBtn');
              const oRelationTxt = this.byId('RelationTxt');
              const oBirthDatePicker = this.byId('BirthDatePicker');

              oDetailModel.setProperty('/BenefitRelation', new ComboEntry({ codeKey: 'Zcode', valueKey: 'Ztext', mEntries: oResult }));
              oDetailModel.setProperty('/TargetList', []);

              if (!oDetailModel.getProperty('/FormData/ZappStatAl') || oDetailModel.getProperty('/FormData/ZappStatAl') === '10') {
                if (!!oResult[0] && oResult[0].Zcode === 'ME') {
                  this.onTargetDialog();
                  oRelationBtn.setVisible(false);
                  oRelationTxt.setEditable(false);
                  oBirthDatePicker.setEditable(false);
                } else {
                  oRelationBtn.setVisible(true);
                  oRelationTxt.setEditable(true);
                  oBirthDatePicker.setEditable(true);
                }
              }
            }
          },
          error: (oError) => {
            const vErrorMSG = AppUtils.parseError(oError);

            MessageBox.error(vErrorMSG);
          },
        });
      },

      // 경조유형 선택시
      onTypeChange(oEvent) {
        const oModel = this.getModel(ServiceNames.BENEFIT);
        const oDetailModel = this.getViewModel();
        const sSelectKey = oEvent.getSource().getSelectedKey();
        let sSelectText = oEvent.getSource().getSelectedItem().getText();

        oDetailModel.setProperty('/FormData/Context', sSelectText);

        new Promise((resolve) => {
          oModel.read('/BenefitCodeListSet', {
            filters: [
              new sap.ui.model.Filter('Cdnum', sap.ui.model.FilterOperator.EQ, 'BE0002'),
              new sap.ui.model.Filter('Werks', sap.ui.model.FilterOperator.EQ, oDetailModel.getProperty('/TargetInfo/Werks')),
              new sap.ui.model.Filter('Datum', sap.ui.model.FilterOperator.EQ, new Date()),
              new sap.ui.model.Filter('Upcod', sap.ui.model.FilterOperator.EQ, sSelectKey),
              new sap.ui.model.Filter('Upcod2', sap.ui.model.FilterOperator.EQ, 'E'),
            ],
            success: (oData) => {
              if (oData) {
                const aList = oData.results;

                oDetailModel.setProperty('/BenefitCause', new ComboEntry({ codeKey: 'Zcode', valueKey: 'Ztext', mEntries: aList }));
                oDetailModel.setProperty('/BenefitRelation', new ComboEntry({ codeKey: 'Zcode', valueKey: 'Ztext' }));
                oDetailModel.setProperty('/FormData/Conresn', 'ALL');
                oDetailModel.setProperty('/FormData/Kdsvh', 'ALL');
              }

              const oRelationBtn = this.byId('RelationBtn');
              const oRelationTxt = this.byId('RelationTxt');
              const oBirthDatePicker = this.byId('BirthDatePicker');

              oRelationBtn.setVisible(true);
              oRelationTxt.setEditable(true);
              oBirthDatePicker.setEditable(true);
              oDetailModel.setProperty('/TargetList', []);
              oDetailModel.setProperty('/FormData/Zname', '');
              oDetailModel.setProperty('/FormData/Zbirthday', null);

              resolve();
            },
            error: (oError) => {
              const vErrorMSG = AppUtils.parseError(oError);

              MessageBox.error(vErrorMSG);
            },
          });
        }).then(() => {
          this.getNomalPay();
        });
      },

      // 경조사유 선택시
      onCauseChange(oEvent) {
        const oModel = this.getModel(ServiceNames.BENEFIT);
        const oDetailModel = this.getViewModel();
        const oFormData = oDetailModel.getProperty('/FormData');
        const sSelectKey = oEvent.getSource().getSelectedKey();
        const sSelectText = oEvent.getSource().getSelectedItem().getText();

        oDetailModel.setProperty('/FormData/Conretx', sSelectText);

        this.getNomalPay(this);

        oModel.read('/BenefitCodeListSet', {
          filters: [
            new sap.ui.model.Filter('Cdnum', sap.ui.model.FilterOperator.EQ, 'BE0003'),
            new sap.ui.model.Filter('Werks', sap.ui.model.FilterOperator.EQ, oDetailModel.getProperty('/TargetInfo/Werks')),
            new sap.ui.model.Filter('Datum', sap.ui.model.FilterOperator.EQ, new Date()),
            new sap.ui.model.Filter('Upcod', sap.ui.model.FilterOperator.EQ, oFormData.Concode),
            new sap.ui.model.Filter('Upcod2', sap.ui.model.FilterOperator.EQ, sSelectKey),
          ],
          success: (oData) => {
            if (oData) {
              const oResult = oData.results;
              const oRelationBtn = this.byId('RelationBtn');
              const oRelationTxt = this.byId('RelationTxt');
              const oBirthDatePicker = this.byId('BirthDatePicker');

              oDetailModel.setProperty('/TargetList', []);
              oDetailModel.setProperty('/FormData/Zname', '');
              oDetailModel.setProperty('/FormData/Zbirthday', null);

              if (!oDetailModel.getProperty('/FormData/ZappStatAl') || oDetailModel.getProperty('/FormData/ZappStatAl') === '10') {
                if (!!oResult[0] && oResult[0].Zcode === 'ME') {
                  oDetailModel.setProperty('/BenefitRelation', oResult);
                  this.onTargetDialog();
                  oRelationBtn.setVisible(false);
                  oRelationTxt.setEditable(false);
                  oBirthDatePicker.setEditable(false);
                } else {
                  oDetailModel.setProperty('/BenefitRelation', new ComboEntry({ codeKey: 'Zcode', valueKey: 'Ztext', mEntries: oResult }));
                  oDetailModel.setProperty('/FormData/Kdsvh', 'ALL');
                  oRelationBtn.setVisible(true);
                  oRelationTxt.setEditable(true);
                  oBirthDatePicker.setEditable(true);
                }
              }
            }
          },
          error: (oError) => {
            const vErrorMSG = AppUtils.parseError(oError);

            MessageBox.error(vErrorMSG);
          },
        });
      },

      // 대상자 관계선택시
      onRelationChange(oEvent) {
        const oDetailModel = this.getViewModel();
        const sSelectKey = oEvent.getSource().getSelectedKey();
        const oRelationBtn = this.byId('RelationBtn');
        const oRelationTxt = this.byId('RelationTxt');
        const oBirthDatePicker = this.byId('BirthDatePicker');

        oDetailModel.setProperty('/FormData/Kdsvh', sSelectKey);

        if (!!sSelectKey && sSelectKey === 'ME') {
          this.onTargetDialog();
          oRelationBtn.setVisible(false);
          oRelationTxt.setEditable(false);
          oBirthDatePicker.setEditable(false);
        } else {
          oDetailModel.setProperty('/FormData/Zbirthday', null);
          oDetailModel.setProperty('/FormData/Zname', '');
          oRelationBtn.setVisible(true);
          oRelationTxt.setEditable(true);
          oBirthDatePicker.setEditable(true);
        }
      },

      // 증빙상 경조일 선택시
      onBenefitChangeDate(oEvent) {
        this.getViewModel().setProperty('/FormData/Conrdate', oEvent.getSource().getDateValue());
        this.getNomalPay();
      },

      // 기본급, 지급율 등 받아옴
      getNomalPay() {
        const oModel = this.getModel(ServiceNames.BENEFIT);
        const oDetailModel = this.getViewModel();
        const vConcode = oDetailModel.getProperty('/FormData/Concode');
        const vConresn = oDetailModel.getProperty('/FormData/Conresn');
        const vConddate = oDetailModel.getProperty('/FormData/Conddate');

        if (!vConcode || !vConresn || !vConddate) return;

        oModel.read('/ConExpenseCheckListSet', {
          filters: [
            new sap.ui.model.Filter('Werks', sap.ui.model.FilterOperator.EQ, oDetailModel.getProperty('/TargetInfo/Werks')),
            new sap.ui.model.Filter('Concode', sap.ui.model.FilterOperator.EQ, vConcode),
            new sap.ui.model.Filter('Conresn', sap.ui.model.FilterOperator.EQ, vConresn),
            new sap.ui.model.Filter('Conddate', sap.ui.model.FilterOperator.EQ, vConddate),
          ],
          success: (oData) => {
            if (oData) {
              const oPay = oData.results[0];

              oDetailModel.setProperty('/FormData/ZbacBet', oPay.ZbacBet);
              oDetailModel.setProperty('/FormData/ZbacBetT', oPay.ZbacBetT);
              oDetailModel.setProperty('/FormData/Payrt', oPay.Payrt);
              oDetailModel.setProperty('/FormData/PayrtT', oPay.PayrtT);
              oDetailModel.setProperty('/FormData/ZpayBetT', oPay.ZpayBetT);
              oDetailModel.setProperty('/FormData/ZpayBet', oPay.ZpayBet);
              oDetailModel.setProperty('/FormData/Zflower', oPay.Zflower);
              oDetailModel.setProperty('/FormData/Zemp', oPay.Zemp);
            }
          },
          error: (oError) => {
            const vErrorMSG = AppUtils.parseError(oError);

            MessageBox.error(vErrorMSG);
          },
        });
      },

      // 대상자 성명 선택시
      async onTargetDialog() {
        const oDetailModel = this.getViewModel();

        // load asynchronous XML fragment
        if (!this.byId('targetSettingsDialog')) {
          Fragment.load({
            id: this.getView().getId(),
            name: 'sap.ui.yesco.mvc.view.congratulation.TargetDialog',
            controller: this,
          }).then(async (oDialog) => {
            // connect dialog to the root view of this component (models, lifecycle)
            this.getView().addDependent(oDialog);
            oDialog.addStyleClass(this.getOwnerComponent().getContentDensityClass());
            await this.getTargetList();

            const oTargetData = oDetailModel.getProperty('/TargetList');

            if (oTargetData.length === 1 || oDetailModel.getProperty('/FormData/Kdsvh') === 'ME') return;

            if (oTargetData.length === 0) {
              return MessageBox.alert(this.getBundleText('MSG_03006'));
            }

            oDialog.open();
          });
        } else {
          await this.getTargetList();

          const oTargetData = oDetailModel.getProperty('/TargetList');

          if (oTargetData.length === 1 || oDetailModel.getProperty('/FormData/Kdsvh') === 'ME') return;

          if (oTargetData.length === 0) {
            return MessageBox.alert(this.getBundleText('MSG_03006'));
          }

          this.byId('targetSettingsDialog').open();
        }
      },

      // 대상자 리스트 조회
      getTargetList() {
        const oModel = this.getModel(ServiceNames.BENEFIT);
        const oDetailModel = this.getViewModel();
        const oFormData = oDetailModel.getProperty('/FormData');

        return new Promise((resolve) => {
          oModel.read('/ConExpenseSupportListSet', {
            filters: [
              new sap.ui.model.Filter('Werks', sap.ui.model.FilterOperator.EQ, oDetailModel.getProperty('/TargetInfo/Werks')),
              new sap.ui.model.Filter('Concode', sap.ui.model.FilterOperator.EQ, oFormData.Concode),
              new sap.ui.model.Filter('Conresn', sap.ui.model.FilterOperator.EQ, oFormData.Conresn),
              new sap.ui.model.Filter('Datum', sap.ui.model.FilterOperator.EQ, new Date()),
            ],
            success: (oData) => {
              if (oData) {
                const oTargetList = oData.results;
                const oChildList = [];

                oTargetList.forEach((e) => {
                  if (oTargetList.length !== 0 && oFormData.Kdsvh === e.Kdsvh) {
                    oChildList.push(e);
                  }
                });

                if (oTargetList.length === 1) {
                  oDetailModel.setProperty('/FormData/Zbirthday', oTargetList[0].Zbirthday);
                  oDetailModel.setProperty('/FormData/Kdsvh', oTargetList[0].Kdsvh);
                  oDetailModel.setProperty('/FormData/Zname', oTargetList[0].Zname);
                }

                oDetailModel.setProperty('/TargetList', oChildList);
                this.byId('targetTable').setVisibleRowCount(oChildList.length);
              }

              resolve();
            },
            error: (oError) => {
              const vErrorMSG = AppUtils.parseError(oError);

              MessageBox.error(vErrorMSG);
            },
          });
        });
      },

      // Dialog 대상자 클릭
      TargetClick(oEvent) {
        const vPath = oEvent.getParameters().rowBindingContext.getPath();
        const oDetailModel = this.getViewModel();
        const oRowData = oDetailModel.getProperty(vPath);

        oDetailModel.setProperty('/FormData/Zbirthday', oRowData.Zbirthday);
        oDetailModel.setProperty('/FormData/Kdsvh', oRowData.Kdsvh);
        oDetailModel.setProperty('/FormData/Zname', oRowData.Zname);
        this.byId('targetSettingsDialog').close();
      },

      //  대상자 성명 Dialog 닫기클릭
      onClick() {
        this.byId('targetSettingsDialog').close();
      },

      checkError() {
        const oDetailModel = this.getViewModel();
        const oFormData = oDetailModel.getProperty('/FormData');

        // 경조유형
        if (oFormData.Concode === 'ALL' || !oFormData.Concode) {
          MessageBox.alert(this.getBundleText('MSG_02010'));
          return true;
        }

        // 경조사유
        if (oFormData.Conresn === 'ALL' || !oFormData.Conresn) {
          MessageBox.alert(this.getBundleText('MSG_02011'));
          return true;
        }

        // 대상자 관계
        if (oFormData.Kdsvh === 'ALL' || !oFormData.Kdsvh) {
          MessageBox.alert(this.getBundleText('MSG_02012'));
          return true;
        }

        // 대상자 생년월일
        if (!oFormData.Zbirthday) {
          MessageBox.alert(this.getBundleText('MSG_02006'));
          return true;
        }

        // 경조일
        if (!oFormData.Conddate) {
          MessageBox.alert(this.getBundleText('MSG_02007'));
          return true;
        }

        // 대상자 성명
        if (!oFormData.Zname) {
          MessageBox.alert(this.getBundleText('MSG_02008'));
          return true;
        }

        // 행사장소
        if (!oFormData.Zeloc) {
          MessageBox.alert(this.getBundleText('MSG_02009'));
          return true;
        }

        return false;
      },

      // 재작성
      onRewriteBtn() {
        this.getViewModel().setProperty('/FormData/ZappStatAl', '10');
      },

      // oData호출 mapping
      sendDataFormat(oDatas) {
        let oSendObject = {
          Appdt: oDatas.Appdt,
          Appno: oDatas.Appno,
          Apename: oDatas.Apename,
          Appernr: oDatas.Appernr,
          Concode: oDatas.Concode,
          Conddate: moment(oDatas.Conddate).hours(10).toDate(),
          Conrdate: moment(oDatas.Conrdate).hours(10).toDate(),
          Conresn: oDatas.Conresn,
          Conretx: oDatas.Conretx,
          Context: oDatas.Context,
          Ename: oDatas.Ename,
          Kdsvh: oDatas.Kdsvh,
          Orgtx: oDatas.Orgtx,
          Payrt: oDatas.Payrt,
          PayrtT: oDatas.PayrtT,
          Pernr: oDatas.Pernr,
          ZbacBet: oDatas.ZbacBet,
          ZbacBetT: oDatas.ZbacBetT,
          Zbirthday: moment(oDatas.Zbirthday).hours(10).toDate(),
          Zeloc: oDatas.Zeloc,
          Zemp: oDatas.Zemp,
          Zflower: oDatas.Zflower,
          Zname: oDatas.Zname,
          ZpayBet: oDatas.ZpayBet,
          ZpayBetT: oDatas.ZpayBetT,
          Zzjikcht: oDatas.Zzjikcht,
          Zzjikgbt: oDatas.Zzjikgbt,
          Zzjiktlt: oDatas.Zzjiktlt,
        };

        return oSendObject;
      },

      // 임시저장
      onSaveBtn() {
        const oModel = this.getModel(ServiceNames.BENEFIT);
        const oDetailModel = this.getViewModel();
        const oFormData = oDetailModel.getProperty('/FormData');
        const vStatus = oFormData.ZappStatAl;

        if (this.checkError(this)) return;

        MessageBox.confirm(this.getBundleText('MSG_00006', 'LABEL_00103'), {
          title: this.getBundleText('LABEL_02022'),
          actions: [this.getBundleText('LABEL_00103'), this.getBundleText('LABEL_00118')],
          onClose: async (vPress) => {
            if (vPress && vPress === this.getBundleText('LABEL_00103')) {
              try {
                AppUtils.setAppBusy(true, this);

                if (!vStatus || vStatus === '45') {
                  const vAppno = await Appno.get.call(this);

                  oDetailModel.setProperty('/FormData/Appno', vAppno);
                  oDetailModel.setProperty('/FormData/ZappStatAl', '10');
                  oDetailModel.setProperty('/FormData/Appdt', new Date());
                }

                let oSendObject = {};
                const oSendData = this.sendDataFormat(oFormData);

                oSendObject = oSendData;
                oSendObject.Prcty = 'T';
                oSendObject.Actty = 'E';
                oSendObject.Waers = 'KRW';

                // FileUpload
                await AttachFileAction.uploadFile.call(this, oFormData.Appno, this.TYPE_CODE);

                await new Promise((resolve, reject) => {
                  oModel.create('/ConExpenseApplSet', oSendObject, {
                    success: () => {
                      resolve();
                    },
                    error: (oError) => {
                      const vErrorMSG = AppUtils.parseError(oError);

                      reject(vErrorMSG);
                    },
                  });
                });
                MessageBox.alert(this.getBundleText('MSG_00007', 'LABEL_00103'));
              } catch (error) {
                if (_.has(error, 'code') && error.code === 'E') {
                  MessageBox.error(error.message);
                }
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
        const oFormData = oDetailModel.getProperty('/FormData');
        const vStatus = oFormData.ZappStatAl;

        if (this.checkError(this)) return;

        MessageBox.confirm(this.getBundleText('MSG_00006', 'LABEL_00121'), {
          title: this.getBundleText('LABEL_02022'),
          actions: [this.getBundleText('LABEL_00121'), this.getBundleText('LABEL_00118')],
          onClose: async (vPress) => {
            if (vPress && vPress === this.getBundleText('LABEL_00121')) {
              try {
                AppUtils.setAppBusy(true, this);

                if (!vStatus || vStatus === '45') {
                  const vAppno = await Appno.get.call(this);

                  oDetailModel.setProperty('/FormData/Appno', vAppno);
                  oDetailModel.setProperty('/FormData/Appdt', new Date());
                }

                let oSendObject = {};
                const oSendData = this.sendDataFormat(oFormData);

                oSendObject = oSendData;
                oSendObject.Prcty = 'C';
                oSendObject.Actty = 'E';
                oSendObject.Waers = 'KRW';

                // FileUpload
                await AttachFileAction.uploadFile.call(this, oFormData.Appno, this.TYPE_CODE);
                await new Promise((resolve, reject) => {
                  oModel.create('/ConExpenseApplSet', oSendObject, {
                    success: () => {
                      resolve();
                    },
                    error: (oError) => {
                      const vErrorMSG = AppUtils.parseError(oError);

                      reject(vErrorMSG);
                    },
                  });
                });

                MessageBox.alert(this.getBundleText('MSG_00007', 'LABEL_00121'), {
                  onClose: () => {
                    this.getRouter().navTo('congratulation');
                  },
                });
              } catch (error) {
                if (_.has(error, 'code') && error.code === 'E') {
                  MessageBox.error(error.message);
                }
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
          title: this.getBundleText('LABEL_02022'),
          actions: [this.getBundleText('LABEL_00114'), this.getBundleText('LABEL_00118')],
          onClose: (vPress) => {
            if (vPress && vPress === this.getBundleText('LABEL_00114')) {
              AppUtils.setAppBusy(true, this);

              let oSendObject = {};

              oSendObject = oDetailModel.getProperty('/FormData');
              oSendObject.Prcty = 'W';
              oSendObject.Actty = 'E';

              oModel.create('/ConExpenseApplSet', oSendObject, {
                success: () => {
                  AppUtils.setAppBusy(false, this);
                  MessageBox.alert(this.getBundleText('MSG_00038', 'LABEL_00121'), {
                    onClose: () => {
                      this.getRouter().navTo('congratulation');
                    },
                  });
                },
                error: (oError) => {
                  const vErrorMSG = AppUtils.parseError(oError);

                  AppUtils.setAppBusy(false, this);
                  MessageBox.error(vErrorMSG);
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
          title: this.getBundleText('LABEL_02022'),
          actions: [this.getBundleText('LABEL_00110'), this.getBundleText('LABEL_00118')],
          onClose: (vPress) => {
            if (vPress && vPress === this.getBundleText('LABEL_00110')) {
              AppUtils.setAppBusy(true, this);

              const sPath = oModel.createKey('/ConExpenseApplSet', {
                Appno: oDetailModel.getProperty('/FormData/Appno'),
              });

              oModel.remove(sPath, {
                success: () => {
                  AppUtils.setAppBusy(false, this);
                  MessageBox.alert(this.getBundleText('MSG_00007', 'LABEL_00110'), {
                    onClose: () => {
                      this.getRouter().navTo('congratulation');
                    },
                  });
                },
                error: (oError) => {
                  const vErrorMSG = AppUtils.parseError(oError);

                  AppUtils.setAppBusy(false, this);
                  MessageBox.error(vErrorMSG);
                },
              });
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
          Editable: !sStatus || sStatus === '10',
          Type: this.TYPE_CODE,
          Appno: sAppno,
          Max: 10,
          FileTypes: ['jpg', 'pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'bmp', 'png'],
        });
      },
    });
  }
);
