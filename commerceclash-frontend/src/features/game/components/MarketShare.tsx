import { useNavigate } from "react-router-dom";

// Define TypeScript interfaces for the API structure
interface Student {
    id: string;
    name: string;
    market_share: number;
    ceo: boolean;
}

interface MarketShareData {
    is_ms_set: boolean;
    students: Student[];
}

interface ApiResponse {
    data: MarketShareData;
}

const MarketShare = () => {
    // Sample data - replace this with your actual API call
    const apiData: ApiResponse = {
        data: {
            is_ms_set: true,
            students: [
                {
                    id: "a1b2c3d4",
                    name: "Alice Johnson",
                    market_share: 150,
                    ceo: false
                },
                {
                    id: "b2c3d4e5",
                    name: "Bob Smith",
                    market_share: 200,
                    ceo: true
                },
                {
                    id: "c3d4e5f6",
                    name: "Carol Williams",
                    market_share: 175,
                    ceo: false
                }
            ]
        }
    };
    // const courseId = location.state?.courseId;
    const navigate = useNavigate();

    const handleNaviagtion = () => {
        navigate(-1);
    }
    const { is_ms_set, students } = apiData.data;

    return (
        <div className="p-6">
            <button onClick={handleNaviagtion}>Go BAck</button>
            <div className="mb-4 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold mb-2">Market Share Overview</h1>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-neutral-500">Market Share Status:</span>
                        <span className={`px-2 py-1 rounded text-sm font-medium ${is_ms_set
                            ? 'bg-success-100 text-success-800'
                            : 'bg-danger-100 text-danger-800'
                            }`}>
                            {is_ms_set ? 'Active' : 'Inactive'}
                        </span>
                    </div>
                </div>

                <button >Download</button>
            </div>
            <div className="overflow-x-auto rounded-lg border border-neutral-200">
                <table className="min-w-full divide-y divide-neutral-200">
                    <thead className="bg-neutral-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                                Name
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                                Market Share
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                                Role
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                                ID
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-neutral-200">
                        {students.map((student) => (
                            <tr key={student.id} className="hover:bg-neutral-50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-neutral-900">
                                        {student.name}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-neutral-900">{student.market_share}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {student.ceo ? (
                                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-secondary-100 text-secondary-800">
                                            CEO
                                        </span>
                                    ) : (
                                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-neutral-100 text-neutral-800">
                                            Member
                                        </span>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                                    {student.id}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {students.length === 0 && (
                <div className="text-center py-8 text-neutral-500">
                    No students found
                </div>
            )}
        </div>
    );
};

export default MarketShare;