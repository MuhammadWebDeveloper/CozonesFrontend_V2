import React from 'react'
import Cozonessec_1 from '../pagescomponents/home/cozonessec1'
import Open_Deskes from '../pagescomponents/home/openDeskes'
import Dedicated_Desks from '../pagescomponents/home/DedicatedDesk'
import Private_Cabins from '../pagescomponents/home/PrivateCabins'
import Meeting_Rooms from '../pagescomponents/home/MeetingRooms'

function Home() {
    return (
        <>
            <Cozonessec_1 />
            <Open_Deskes title={"Open Desks"} />
            <Dedicated_Desks title={"Dedicated Desks"} />
            <Private_Cabins title={"Private Cabins"} />
            <Meeting_Rooms title={"Meeting Rooms"} />
        </>
    )
}

export default Home