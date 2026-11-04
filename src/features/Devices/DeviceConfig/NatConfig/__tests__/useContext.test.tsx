import useGetDeviceNatConfigMocked from "@/generated/edge-administration/hooks/__mocks__/useGetDeviceNatConfig"
import { postDeviceNatConfigMocked } from "@/generated/edge-administration/hooks/__mocks__/usePostDeviceNatConfig"
import useGetSmartEmsStatusMocked from "@/generated/edge-administration/hooks/__mocks__/useGetSmartEmsStatus"
import useDeviceNatConfigContext from "../useContext"
import { act, renderHook } from "@testing-library/react"

vi.mock("@/generated/edge-administration/hooks/useGetDeviceNatConfig")
vi.mock("@/generated/edge-administration/hooks/usePostDeviceNatConfig")
vi.mock("@/generated/edge-administration/hooks/useGetSmartEmsStatus")

describe("Device NAT Config custom hook", () => {
  it("should call useGetDeviceNatConfig with deviceId when it's given as prop", () => {
    renderHook(() => useDeviceNatConfigContext("deviceId"))

    expect(useGetDeviceNatConfigMocked).toHaveBeenCalledWith("deviceId")
  })

  it("should call useGetSmartEmsStatus to be able to check the firmware version", () => {
    renderHook(() => useDeviceNatConfigContext("deviceId"))

    expect(useGetSmartEmsStatusMocked).toHaveBeenCalled()
  })

  suite("should tell if the provider is loading based on the isLoading of the getHooks", () => {
    const testCases = [
      { isGetNatConfigLoading: true, isSmartEmsStatusLoading: false, expected: true },
      { isGetNatConfigLoading: false, isSmartEmsStatusLoading: true, expected: true },
      { isGetNatConfigLoading: true, isSmartEmsStatusLoading: true, expected: true },
      { isGetNatConfigLoading: false, isSmartEmsStatusLoading: false, expected: false },
    ];

    testCases.forEach(({ isGetNatConfigLoading, isSmartEmsStatusLoading, expected }) => {
      it(`isGetNatConfigLoading: ${isGetNatConfigLoading}, isSmartEmsStatusLoading: ${isSmartEmsStatusLoading}`, () => {
        useGetDeviceNatConfigMocked.mockReturnValueOnce({
          isLoading: isGetNatConfigLoading
        })
        useGetSmartEmsStatusMocked.mockReturnValueOnce({
          isLoading: isSmartEmsStatusLoading
        })

        const { result } = renderHook(() => useDeviceNatConfigContext("deviceId"))

        expect(result.current.isLoading).toBe(expected)
      })
    })
  })

  it("should update the nat rules", async () => {
    const { result } = renderHook(() => useDeviceNatConfigContext("deviceId"))

    act(() => {
      result.current.addNatRule(({extIp: "1", intIp: "2", name: "my_new_rule_name"}))
    })

    expect(result.current.natConfig?.nat_rules?.length).toBe(3)
    expect(result.current.natConfig?.nat_rules![2]).toMatchObject({extIp: "1", intIp: "2", name: "my_new_rule_name"})
    expect(result.current.natConfig?.nat_enabled).toBe(true)
  })

  it("should disable nat once the last rule is deleted", () => {
    const { result } = renderHook(() => useDeviceNatConfigContext("deviceId"))
    const ruleCount = result.current.natConfig?.nat_rules?.length ?? 0

    for (let i = 0; i < ruleCount; i++) {
      act(() => {
        result.current.deleteRule(0)
      })
    }

    expect(result.current.natConfig?.nat_rules?.length).toBe(0)
    expect(result.current.natConfig?.nat_enabled).toBe(false)
  })

  it("should update a specific rule", () => {
     const { result } = renderHook(() => useDeviceNatConfigContext("deviceId"))

     act(() => {
       result.current.updateRule({
         index: 0,
         rule: {
           extIp: "updated-ext",
           intIp: "updated-int",
           name: "updated-name"
         }
       })
     })

     expect(result.current.natConfig!.nat_rules![0]).toMatchObject({
       extIp: "updated-ext",
       intIp: "updated-int",
       name: "updated-name"
     })
  })

  it("should delete a specific rule", () => {
    const { result } = renderHook(() => useDeviceNatConfigContext("deviceId"))

    act(() => {
      result.current.deleteRule(0)
    })

    expect(result.current.natConfig?.nat_rules?.length).toBe(1)
  })

  it("should call the usePostDeviceNatConfig hook", () => {
    useGetDeviceNatConfigMocked.mockReturnValue({data: {nat_enabled: false, nat_rules: []}})
    const { result } = renderHook(() => useDeviceNatConfigContext("deviceId"))

    act(() => {
      result.current.postConfig()
    })

    expect(postDeviceNatConfigMocked).toHaveBeenCalledWith({
      deviceId: "deviceId",
      body:  {
        "nat_enabled": false,
        "nat_rules": [
        ]
      }
    })
    useGetDeviceNatConfigMocked.mockRestore()
  })
})
