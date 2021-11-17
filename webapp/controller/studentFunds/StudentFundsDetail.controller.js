/* eslint-disable no-useless-call */
sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/model/json/JSONModel',
    'sap/ui/yesco/control/MessageBox',
    '../../model/formatter',
    'sap/ui/yesco/common/EmpInfo',
    'sap/ui/yesco/common/Appno',
    'sap/ui/yesco/controller/BaseController',
    'sap/ui/yesco/common/AttachFileAction',
    'sap/ui/yesco/common/odata/ServiceNames',
  ],
  (
    // prettier 방지용 주석
    JSONModel,
	MessageBox,
	formatter,
	EmpInfo,
	Appno,
	BaseController,
	AttachFileAction,
	ServiceNames
  ) => {
    'use strict';

    class StudentFundsDetail extends BaseController {
      constructor() {
        super();
        this.formatter = formatter;
        this.AttachFileAction = AttachFileAction;
        this.TYPE_CODE = 'HR02';
      }

      onBeforeShow() {
        const oViewModel = new JSONModel({
          FormData: {},
          Settings: {},
          busy: false,
          LimitAmountMSG: false,
          MajorInput: false,
        });
        this.setViewModel(oViewModel);

        this.getViewModel().setProperty('/busy', true);
        EmpInfo.get.call(this);
        this.getRouter().getRoute('studentFunds-detail').attachPatternMatched(this.onObjectMatched, this);
      }

      onAfterShow() {
        this.getList()
        .then(() => {
          this.settingsAttachTable();
          this.getViewModel().setProperty('/busy', false);
          super.onAfterShow();
        });
      }

      onNavBack() {
        this.onNavBack();
        // window.history.go(-1);
      }

      onObjectMatched(oEvent) {
        const sDataKey = oEvent.getParameter('arguments').oDataKey;

        if (sDataKey !== 'N') {
          this.getTargetData(sDataKey);
        } else {
          const oDetailModel = this.getViewModel();
          const oTargetInfo = oDetailModel.getProperty('/TargetInfo');

          oDetailModel.setProperty('/FormData', oTargetInfo);
          oDetailModel.setProperty('/FormData/Apename', oTargetInfo.Ename);
          oDetailModel.setProperty('/FormData/Appernr', oTargetInfo.Pernr);

          oDetailModel.setProperty('/ApplyInfo', {
            Apename: oTargetInfo.Ename,
            Orgtx: `${oTargetInfo.Btrtx}/${oTargetInfo.Orgtx}`,
            Apjikgbtl: `${oTargetInfo.Zzjikgbt}/${oTargetInfo.Zzjiktlt}`,
          });
        }
      }

      // 해외학교 체크시
      onCheckBox(oEvent) {
        const bSelected = oEvent.getSource().getSelected();

        if (bSelected) {
          this.getViewModel().setProperty('/FormData/Forsch', 'X');
          this.getSupAmount();
        } else {
          this.getViewModel().setProperty('/FormData/Forsch', '');
          this.totalCost();
        }
      }

      // 학자금 총액에 들어가는 금액입력
      costCalculation(oEvent) {
        this.formatter.liveChangeCost.call(this, oEvent);
        this.totalCost();
      }

      // 장학금 입력시
      onSchoCost(oEvent) {
        this.formatter.liveChangeCost.call(this, oEvent);
      }

      // 지원금액 호출
      getSupAmount() {
        const oModel = this.getModel(ServiceNames.BENEFIT);
        const oDetailModel = this.getViewModel();
        const oFormData = oDetailModel.getProperty('/FormData');
        const sUrl = '/BenefitCodeListSet';

        new Promise((resolve) => {
          oModel.read(sUrl, {
            filters: [
              new sap.ui.model.Filter('Cdnum', sap.ui.model.FilterOperator.EQ, 'BE0007'),
              new sap.ui.model.Filter('Werks', sap.ui.model.FilterOperator.EQ, oDetailModel.getProperty('/TargetInfo/Werks')),
              new sap.ui.model.Filter('Upcod', sap.ui.model.FilterOperator.EQ, oFormData.Slart),
              new sap.ui.model.Filter('Upcod2', sap.ui.model.FilterOperator.EQ, oFormData.Zyear),
            ],
            success: (oData) => {
              this.debug(`${sUrl} success.`, oData);
              let oList = [];

              if (oData && !!oData.results.length) {
                oList = oData.results[0];
                oList.Zbetrg = oList.Zbetrg.replace('.', '');
              }

              oDetailModel.setProperty('/LimitAmount', oList);
              resolve();
            },
            error: (oRespnse) => {
              const vErrorMSG = JSON.parse(oRespnse.responseText).error.innererror.errordetails[0].message;
              
              this.debug(`${sUrl} error.`, vErrorMSG);
              MessageBox.error(vErrorMSG);
            },
          });
        }).then(() => {
          this.totalCost();
        });
      }

      // 학자금 총액
      totalCost() {
        const oDetailModel = this.getViewModel();
        const oFormData = oDetailModel.getProperty("/FormData");
        const oLimitData = oDetailModel.getProperty("/LimitAmount");
        const vCostA = parseInt(oFormData.ZbetEntr) || 0;
        const vCostB = parseInt(oFormData.ZbetMgmt) || 0;
        const vCostC = parseInt(oFormData.ZbetClass) || 0;
        const vCostD = parseInt(oFormData.ZbetExer) || 0;
        const vCostE = parseInt(oFormData.ZbetSuf) || 0;
        const vCostF = parseInt(oFormData.ZbetEtc) || 0;
        const bForschCheck = oFormData.Forsch === 'X';
        let vCostG = parseInt(oFormData.ZbetTotl) || 0;

        vCostG = vCostA + vCostB + vCostC + vCostD + vCostE + vCostF;
        oDetailModel.setProperty("/FormData/ZbetTotl", String(vCostG));

        if (
          bForschCheck &&
          !!oLimitData &&
          !!oLimitData.Zbetrg &&
          vCostG > parseInt(oLimitData.Zbetrg)
        ) {
          oDetailModel.setProperty('/FormData/ZpayAmt', oLimitData.Zbetrg);
          oDetailModel.setProperty('/LimitAmountMSG', true);
        } else {
          oDetailModel.setProperty('/FormData/ZpayAmt', String(vCostG));
          oDetailModel.setProperty('/LimitAmountMSG', false);
        }
      }

      // 상세조회
      getTargetData(sDataKey) {
        const oModel = this.getModel(ServiceNames.BENEFIT);
        const oDetailModel = this.getViewModel();
        const sUrl = '/SchExpenseApplSet';

        oModel.read(sUrl, {
          filters: [new sap.ui.model.Filter('Prcty', sap.ui.model.FilterOperator.EQ, 'D'), new sap.ui.model.Filter('Appno', sap.ui.model.FilterOperator.EQ, sDataKey)],
          success: (oData) => {
            if (oData) {
              this.debug(`${sUrl} success.`, oData);

              const oTargetData = oData.results[0];

              oDetailModel.setProperty('/FormData', oTargetData);
              oDetailModel.setProperty('/ApplyInfo', oTargetData);
              oDetailModel.setProperty('/ApprovalDetails', oTargetData);
            }
          },
          error: (oRespnse) => {
            const vErrorMSG = JSON.parse(oRespnse.responseText).error.innererror.errordetails[0].message;

            this.debug(`${sUrl} error.`, vErrorMSG);
            MessageBox.error(vErrorMSG);
          },
        });
      }

      // 화면관련 List호출
      async getList() {
        const oModel = this.getModel(ServiceNames.BENEFIT);
        const oDetailModel = this.getViewModel();
        const vStatus = oDetailModel.getProperty('/FormData/ZappStatAl');
        const sWerks = oDetailModel.getProperty('/TargetInfo/Werks');
        const sSchExpenseUrl = '/SchExpenseSupportListSet';
        const sBenefitUrl = '/BenefitCodeListSet';

        return Promise.all([
          await new Promise(resolve => {
            // 신청대상 조회
            oModel.read(sSchExpenseUrl, {
              filters: [new sap.ui.model.Filter('Datum', sap.ui.model.FilterOperator.EQ, new Date())],
              success: (oData) => {
                if (oData) {
                  this.debug(`${sSchExpenseUrl} success.`, oData);

                  const oList = oData.results;

                  oDetailModel.setProperty('/AppTarget', oList);

                  if (!vStatus) {
                    oDetailModel.setProperty('/FormData/Znametx', oList[0].Znametx);
                    oDetailModel.setProperty('/FormData/Kdsvh', oList[0].Kdsvh);
                    oDetailModel.setProperty('/FormData/Zzobjps', oList[0].Zzobjps);
                    oDetailModel.setProperty("/MajorInput", false);
                  }

                  resolve();
                }
              },
              error: (oRespnse) => {
                this.debug(`${sSchExpenseUrl} error.`, vErrorMSG);

                const vErrorMSG = JSON.parse(oRespnse.responseText).error.innererror.errordetails[0].message;

                MessageBox.error(vErrorMSG);
              },
            });
          }),
          new Promise(resolve => {
            // 학력구분 조회
            oModel.read(sBenefitUrl, {
              filters: [
                new sap.ui.model.Filter('Cdnum', sap.ui.model.FilterOperator.EQ, 'BE0006'),
                new sap.ui.model.Filter('Werks', sap.ui.model.FilterOperator.EQ, sWerks),
                new sap.ui.model.Filter('Datum', sap.ui.model.FilterOperator.EQ, new Date()),
              ],
              success: (oData) => {
                if (oData) {
                  this.debug(`${sBenefitUrl} success.`, oData);

                  const oList = oData.results;

                  oDetailModel.setProperty('/AcademicSort', oList);

                  if (!vStatus) {
                    oDetailModel.setProperty('/FormData/Slart', oList[0].Zcode);
                  }

                  const sCode = !vStatus ? oList[0].Zcode : oDetailModel.getProperty('/FormData/Slart');

                  resolve(sCode);
                }
              },
              error: (oRespnse) => {
                this.debug(`${sBenefitUrl} error.`, vErrorMSG);

                const vErrorMSG = JSON.parse(oRespnse.responseText).error.innererror.errordetails[0].message;

                MessageBox.error(vErrorMSG);
              },
            });
          }).then((sCode) => {
            this.onShcoolList(sCode);
          }),
          new Promise(resolve => {
            // 학년 조회
            oModel.read(sBenefitUrl, {
              filters: [
                new sap.ui.model.Filter('Cdnum', sap.ui.model.FilterOperator.EQ, 'BE0004'),
                new sap.ui.model.Filter('Grcod', sap.ui.model.FilterOperator.EQ, 'BE000002'),
                new sap.ui.model.Filter('Sbcod', sap.ui.model.FilterOperator.EQ, 'GRADE'),
                new sap.ui.model.Filter('Werks', sap.ui.model.FilterOperator.EQ, sWerks),
                new sap.ui.model.Filter('Datum', sap.ui.model.FilterOperator.EQ, new Date()),
              ],
              success: (oData) => {
                if (oData) {
                  this.debug(`${sBenefitUrl} success.`, oData);

                  const oList = oData.results;

                  oDetailModel.setProperty('/GradeList', oList);

                  if (!vStatus) {
                    oDetailModel.setProperty('/FormData/Grdsp', oList[0].Zcode);
                  }
                  
                  resolve();
                }
              },
              error: (oRespnse) => {
                this.debug(`${sBenefitUrl} error.`, vErrorMSG);

                const vErrorMSG = JSON.parse(oRespnse.responseText).error.innererror.errordetails[0].message;

                MessageBox.error(vErrorMSG);
              },
            });
          }),
          new Promise(resolve => {
            // 학자금 발생년도 셋팅
            const iFullYears = new Date().getFullYear();
            const aYearsList = [];

            aYearsList.push({ Zcode: String(iFullYears), Ztext: `${iFullYears}년` }, { Zcode: String(iFullYears - 1), Ztext: `${iFullYears - 1}년` });

            oDetailModel.setProperty('/FundsYears', aYearsList);

            if (!vStatus) {
              oDetailModel.setProperty('/FormData/Zyear', aYearsList[0].Zcode);
              this.getSupAmount();
            }

            resolve();
          }),
        ]);
      }

      // 신청대상 선택시
      onTargetChange() {
        this.getApplyNumber();
      }

      // 지원횟수 조회
      getApplyNumber() {
        const oModel = this.getModel(ServiceNames.BENEFIT);
        const oDetailModel = this.getViewModel();
        const oFormData = oDetailModel.getProperty("/FormData");
        const sUrl = '/SchExpenseCntSet';

        oDetailModel.getProperty('/AppTarget').forEach((e) => {
          if (e.Zzobjps === oFormData.Zzobjps) {
            oDetailModel.setProperty('/FormData/Kdsvh', e.Kdsvh);
            oDetailModel.setProperty('/FormData/Zname', e.Zname);
          }
        });

        oModel.read(sUrl, {
          filters: [
            new sap.ui.model.Filter('Zname', sap.ui.model.FilterOperator.EQ, oFormData.Zname),
            new sap.ui.model.Filter('Slart', sap.ui.model.FilterOperator.EQ, oFormData.Slart),
            new sap.ui.model.Filter('Zzobjps', sap.ui.model.FilterOperator.EQ, oFormData.Zzobjps),
          ],
          success: (oData) => {
            if (oData) {
              this.debug(`${sUrl} success.`, oData);

              oDetailModel.setProperty('/FormData/Cnttx', oData.results[0].Cnttx);
            }
          },
          error: (oRespnse) => {
            this.debug(`${sUrl} error.`, vErrorMSG);
            
            const vErrorMSG = JSON.parse(oRespnse.responseText).error.innererror.errordetails[0].message;

            MessageBox.error(vErrorMSG);
          },
        });
      }

      // 학자금 발생년도 클릭
      onYearsSelect() {
        this.getApplyNumber();
        this.getSupAmount();
      }

      // 학력구분 선택시
      onShcoolList(oEvent) {
        const oModel = this.getModel(ServiceNames.BENEFIT);
        const oDetailModel = this.getViewModel();
        const bSelectType = typeof oEvent === 'string';
        const vSelected = bSelectType ? oEvent : oEvent.getSource().getSelectedKey();
        const vStatus = oDetailModel.getProperty('/FormData/ZappStatAl');
        const sUrl = '/BenefitCodeListSet';

        if (!vStatus || vStatus === '10') {
          if (vSelected === '05' || vSelected === '06') {
            oDetailModel.setProperty("/MajorInput", true);
          } else {
            oDetailModel.setProperty("/MajorInput", false);
          }

          if (!bSelectType) {
            oDetailModel.setProperty('/FormData/Schtx', '');
            oDetailModel.setProperty('/FormData/Majnm', '');
          }
        }

        this.getApplyNumber();
        this.getSupAmount();

        oModel.read(sUrl, {
          filters: [
            new sap.ui.model.Filter('Cdnum', sap.ui.model.FilterOperator.EQ, 'BE0005'),
            new sap.ui.model.Filter('Werks', sap.ui.model.FilterOperator.EQ, oDetailModel.getProperty('/TargetInfo/Werks')),
            new sap.ui.model.Filter('Datum', sap.ui.model.FilterOperator.EQ, new Date()),
            new sap.ui.model.Filter('Upcod', sap.ui.model.FilterOperator.EQ, vSelected),
          ],
          success: (oData) => {
            if (oData) {
              this.debug(`${sUrl} success.`, oData);

              const oList = oData.results;

              oDetailModel.setProperty('/QuarterList', oList);

              if (!vStatus) {
                oDetailModel.setProperty('/FormData/Divcd', oList[0].Zcode);
              }
            }
          },
          error: (oRespnse) => {
            this.debug(`${sUrl} error.`, vErrorMSG);

            const vErrorMSG = JSON.parse(oRespnse.responseText).error.innererror.errordetails[0].message;

            MessageBox.error(vErrorMSG);
          },
        });
      }

      checkError(AppBtn) {
        const oDetailModel = this.getViewModel();
        const oFormData = oDetailModel.getProperty("/FormData");

        // 학교명
        if (!oFormData.Schtx) {
          MessageBox.alert('학교명을 입력하세요.');
          return true;
        }

        // 수업료
        if (!oFormData.ZbetClass) {
          MessageBox.alert('수업료를 입력하세요.');
          return true;
        }

        // 첨부파일
        if (!AttachFileAction.getFileLength.call(this) && AppBtn === 'O') {
          MessageBox.alert('신청시 첨부파일은 필수입니다. 업로드 후 신청하시기 바랍니다.');
          return true;
        }

        return false;
      }

      // 재작성
      onRewriteBtn() {
        this.getViewModel().setProperty('/FormData/ZappStatAl', '10');
      }

      // oData호출 mapping
      sendDataFormat(oDatas) {
        let oSendObject = {
          Appdt: oDatas.Appdt,
          Appno: oDatas.Appno,
          Apename: oDatas.Apename,
          Appernr: oDatas.Appernr,
          Cnttx: oDatas.Cnttx,
          Divcd: oDatas.Divcd,
          Forsch: oDatas.Forsch,
          Grdsp: oDatas.Grdsp,
          Majnm: oDatas.Majnm,
          Schtx: oDatas.Schtx,
          Slart: oDatas.Slart,
          Kdsvh: oDatas.Kdsvh,
          ZbetClass: oDatas.ZbetClass,
          ZbetEntr: oDatas.ZbetEntr,
          ZbetEtc: oDatas.ZbetEtc,
          ZbetExer: oDatas.ZbetExer,
          ZbetMgmt: oDatas.ZbetMgmt,
          ZbetShip: oDatas.ZbetShip,
          ZbetSuf: oDatas.ZbetSuf,
          ZbetTotl: oDatas.ZbetTotl,
          Znametx: oDatas.Znametx,
          Zname: oDatas.Zname,
          ZpayAmt: oDatas.ZpayAmt,
          Zyear: oDatas.Zyear,
          Zzjikcht: oDatas.Zzjikcht,
          Zzjikgbt: oDatas.Zzjikgbt,
          Zzjiktlt: oDatas.Zzjiktlt,
          Zzobjps: oDatas.Zzobjps,
        };

        return oSendObject;
      }

      // 임시저장
      onSaveBtn() {
        const oModel = this.getModel(ServiceNames.BENEFIT);
        const oDetailModel = this.getViewModel();
        const vStatus = oDetailModel.getProperty('/FormData/ZappStatAl');
        const oFormData = oDetailModel.getProperty('/FormData');

        if (this.checkError()) return;

        MessageBox.confirm('저장 하시겠습니까?', {
          title: '학자금 신청',
          actions: ['저장', '취소'],
          onClose: async (vPress) => {
            if (vPress && vPress === '저장') {
              if (!vStatus || vStatus === '45') {
                const vAppno = await Appno.get.call(this);
    
                oDetailModel.setProperty("/FormData/Appno", vAppno);
                oDetailModel.setProperty('/FormData/Appdt', new Date());
              }
    
              let oSendObject = {};
              const oSendData = this.sendDataFormat(oFormData);
    
              oSendObject = oSendData;
              oSendObject.Prcty = 'T';
              oSendObject.Actty = 'E';
              oSendObject.Waers = 'KRW';
    
              Promise.all([
                  // FileUpload
                AttachFileAction.uploadFile.call(this, oFormData.Appno, this.TYPE_CODE),

                new Promise((resolve, reject) => {
                  oModel.create('/SchExpenseApplSet', oSendObject, {
                    success: () => {
                      resolve();
                    },
                    error: (oRespnse) => {
                      const vErrorMSG = JSON.parse(oRespnse.responseText).error.innererror.errordetails[0].message;

                      reject(vErrorMSG);
                    },
                  });
                }),
              ]).then(() => {
                MessageBox.alert('저장되었습니다.');
              }).catch((vErr) => {
                MessageBox.error(vErr);
              });
            }
          }
        });
      }

      // 신청
      onApplyBtn() {
        const oModel = this.getModel(ServiceNames.BENEFIT);
        const oDetailModel = this.getViewModel();
        const vStatus = oDetailModel.getProperty('/FormData/ZappStatAl');
        const oFormData = oDetailModel.getProperty('/FormData');

        if (this.checkError('O')) return;

        MessageBox.confirm('신청 하시겠습니까?', {
          title: '학자금 신청',
          actions: ['신청', '취소'],
          onClose: async (vPress) => {
            if (vPress && vPress === '신청') {
              if (!vStatus || vStatus === '45') {
                const vAppno = await Appno.get.call(this);
  
                oDetailModel.setProperty("/FormData/Appno", vAppno);
                oDetailModel.setProperty('/FormData/Appdt', new Date());
              }
  
              let oSendObject = {};
              const oSendData = this.sendDataFormat(oFormData);

              oSendObject = oSendData;
              oSendObject.Prcty = 'C';
              oSendObject.Actty = 'E';
              oSendObject.Waers = 'KRW';

              Promise.all([
                // FileUpload
                AttachFileAction.uploadFile.call(this, oFormData.Appno, this.TYPE_CODE),

                new Promise((resolve, reject) => {
                  oModel.create('/SchExpenseApplSet', oSendObject, {
                    success: () => {
                      resolve();
                    },
                    error: (oRespnse) => {
                      const vErrorMSG = JSON.parse(oRespnse.responseText).error.innererror.errordetails[0].message;
    
                      reject(vErrorMSG);
                    },
                  });
                })
              ]).then(() => {
                MessageBox.alert('신청되었습니다.', {
                  onClose: () => {
                    this.getRouter().navTo('studentFunds');
                  },
                });
              }).catch(vErr => {
                MessageBox.error(vErr);
              });
            }
          },
        });
      }

      // 취소
      onCancelBtn() {
        const oModel = this.getModel(ServiceNames.BENEFIT);
        const oDetailModel = this.getViewModel();

        MessageBox.confirm('취소 하시겠습니까?', {
          title: '학자금 신청',
          actions: ['확인', '취소'],
          onClose: (vPress) => {
            if (vPress && vPress === '확인') {
              let oSendObject = {};
  
              oSendObject = oDetailModel.getProperty('/FormData');
              oSendObject.Prcty = 'W';
              oSendObject.Actty = 'E';
  
              oModel.create('/SchExpenseApplSet', oSendObject, {
                success: () => {
                  MessageBox.alert('신청이 취소되었습니다.', {
                    onClose: () => {
                      this.getRouter().navTo('studentFunds');
                    },
                  });
                },
                error: (oRespnse) => {
                  const vErrorMSG = JSON.parse(oRespnse.responseText).error.innererror.errordetails[0].message;
  
                  MessageBox.error(vErrorMSG);
                },
              });
            }
          },
        });
      }

      // 삭제
      onDeleteBtn() {
        const oModel = this.getModel(ServiceNames.BENEFIT);
        const oDetailModel = this.getViewModel();

        MessageBox.confirm('삭제 하시겠습니까?', {
          title: '학자금 신청',
          actions: ['삭제', '취소'],
          onClose: (vPress) => {
            if (vPress && vPress === '삭제') {
              const sPath = oModel.createKey('/SchExpenseApplSet', {
                Appno: oDetailModel.getProperty('/FormData/Appno'),
              });
  
              oModel.remove(sPath, {
                success: () => {
                  MessageBox.alert('삭제되었습니다.', {
                    onClose: () => {
                      this.getRouter().navTo('studentFunds');
                    },
                  });
                },
                error: (oRespnse) => {
                  const vErrorMSG = JSON.parse(oRespnse.responseText).error.innererror.errordetails[0].message;
  
                  MessageBox.error(vErrorMSG);
                },
              });
            }
          },
        });
      }

      // AttachFileTable Settings
      settingsAttachTable() {
        const oDetailModel = this.getViewModel();
        const sStatus = oDetailModel.getProperty('/FormData/ZappStatAl');
        const sAppno = oDetailModel.getProperty('/FormData/Appno') || '';

        AttachFileAction.setAttachFile(this, {
          Editable: !sStatus || sStatus === '10',
          Type: this.TYPE_CODE,
          Appno: sAppno,
          Message: '증빙자료를 꼭 등록하세요.',
          Max: 10,
          FileTypes: ['jpg', 'pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'bmp', 'png'],
        });
      }
    }

    return StudentFundsDetail;
  }
);
