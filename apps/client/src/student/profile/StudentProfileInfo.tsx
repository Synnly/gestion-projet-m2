import type { studentProfile } from '../../types/student.types.ts';

interface Props {
    profile: studentProfile;
    logoUrl?: string | null;
}

export const StudentProfileInfo = ({ profile, logoUrl }: Props) => {
    return (
        <div className="p-6">
            <div className="flex flex-col w-full items-center gap-2">
                <div className="avatar">
                    <div className="w-24 rounded-full">
                        <img src={logoUrl ?? '../../assets/307ce493-b254-4b2d-8ba4-d12c080d6651.jpg'} alt="" />
                    </div>
                </div>
                <div className="font-medium text-3xl">
                    {profile.firstName} {profile.lastName}
                </div>
                {profile.tagLine ? (
                    <div className="text-center italic">{profile.tagLine}</div>
                ) : (
                    <div className="text-center text-accent italic">
                        {profile.firstName} choisit encore sa phrase d'accroche ... Ce sera une merveille promis !
                    </div>
                )}

                <div className="card border border-base-300 shadow-md mt-8 w-full">
                    <div className="card-body">
                        <div className="card-title text-xl">Biographie</div>
                        {profile.biography ? (
                            <div className="text-lg">{profile.biography}</div>
                        ) : (
                            <div className="text-md text-accent italic">
                                {`${profile.firstName} n'a pas fourni de biographie, mais on est certains que c'est un·e super candidat·e`}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
