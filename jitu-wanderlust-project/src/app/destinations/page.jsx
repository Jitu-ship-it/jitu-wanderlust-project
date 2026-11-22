 
import DestinationCard from "@/components/DestinationCard";

export const dynamic = "force-dynamic";

const DestinationPage = async () => {
    const res = await fetch(
        `${process.env.NEXT_PUBLIC_SERVER_URL}/destination`,
        {
            cache: "no-store",
        }
    );

    if (!res.ok) {
        throw new Error("Failed to fetch destinations");
    }

    const destinations = await res.json();

    return (
        <div className="max-w-7xl mx-auto">
            <h1>All destinations</h1>

            <div className="grid grid-cols-4 gap-5">
                {destinations.map((destination) => (
                    <DestinationCard
                        key={destination._id}
                        destination={destination}
                    />
                ))}
            </div>
        </div>
    );
};

export default DestinationPage;
