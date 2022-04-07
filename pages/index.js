import { useState, useEffect } from 'react'
import Head from 'next/head'
import Web3 from 'web3'
import lotteryContract from '../blockchain/lottery'
import styles from '../styles/Home.module.css'
import 'bulma/css/bulma.css'

export default function Home() {
  const [web3, setweb3] = useState()
  const [address, setAddress] = useState()
  const [lcContract, setLcContract] = useState()
  const [lotteryPot, setLotteryPot] = useState()
  const [lotteryPlayers, setPlayers] = useState([])
  const [lotteryHistory, setLotteryHistory] = useState([])
  const [lotteryId, setLotteryId] = useState()
  const [error, setError] = useState("")
  const [successMsg, setSuccessMsg] = useState("")

  useEffect(() => {
    updateState()
  }, [lcContract])

  const updateState = () => {
    if (lcContract) getPot()
    if (lcContract) getPlayers()
    if (lcContract) getLotteryId()
  }
  
  const getPot = async () => {
    const pot = await lcContract.methods.getBalance().call()
    setLotteryPot(web3.utils.fromWei(pot, 'ether'))
  }

  const getPlayers = async () => {
    const players = await lcContract.methods.getPlayers().call()
    setPlayers(players)
  }

  const getHistory = async (id) => {
    setLotteryHistory([])
    for (let i =parseInt(id); i > 0; i--) {
      console.log('get history')
      const winnerAddress = await lcContract.methods.lotteryHistory(i).call()
      const historyObj = {}
      historyObj.id = i
      historyObj.address = winnerAddress
      setLotteryHistory(lotteryHistory => [...lotteryHistory, historyObj])
    }
  }

  const getLotteryId = async () => {
    const lotteryId = await lcContract.methods.lotteryId().call()
    setLotteryId(lotteryId)
    await getHistory(lotteryId)
    console.log(JSON.stringify(lotteryHistory))
  }

  const enterLotteryHandler = async () => {
    setError("")
    try {
      await lcContract.methods.enter().send({
        from: address,
        value: "20000000000000000",
        gas: 3000000,
        gasPrice: null
      })
      updateState()
    } catch(err) {
      setError(err.message)
    }
  }

  const pickWinnerHandler = async () => {
    setError("")
    setSuccessMsg("")
    console.log(`address from pick winner :: ${address}`)
    try {
      await lcContract.methods.pickWinner().send({
        from: address,
        gas: 3000000,
        gasPrice: null
      })
    } catch(err) {
      setError(err.message)
    }
  }

  const payWinnerHandler = async () => {
    setError("")
    setSuccessMsg("")
    try {
      await lcContract.methods.payWinner().send({
        from: address,
        gas: 3000000,
        gasPrice: null
      })
      console.log(`lottery id :: ${lotteryId}`)
      const winnerAddress = await lcContract.methods.lotteryHistory(lotteryId).call()
      setSuccessMsg(`The winner is ${winnerAddress}`)
      updateState()
    } catch(err) {
      setError(err.message)
    }
  }

  const connectWalletHandler = async () => {
    setError("")
    if (typeof window !== "undefined" && typeof window.ethereum !== "undefinend") {
      try {
        await window.ethereum.request({ method: "eth_requestAccounts" })

        const web3 = new Web3(window.ethereum)
        setweb3(web3)

        const accounts = await web3.eth.getAccounts()
        setAddress(accounts[0])

        const lc = lotteryContract(web3)
        setLcContract(lc)

        window.ethereum.on('accountsChanged', async () => {
          const accounts = await web3.eth.getAccounts()
          setAddress(accounts[0])
        })

      } catch(err) {
        setError(err.message)
      }
    } else {
      console.log("connecting to wallet")
    }
  }

  return (
    <div>
      <Head>
        <title>Ether Lottery</title>
        <meta name="description" content="An Ethereum Lottery dapp" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <nav className='navbar mt-4 mb-4'>
          <div className='container'>
            <div className='navbar-brand'>
              <h1>ETH Lottery</h1>
            </div>
            <div className='navbar-end'>
              <button onClick={connectWalletHandler} className='button is-link'>Connect Wallet</button>
            </div>
          </div>
        </nav>
        <div className='container'>
          <section className='mt-5'>
            <div className='columns'>
              <div className='column is-two-thirds'>
                <section className='mt-5'>
                  <p>Enter the lottery by sending 0.2 Ether</p>
                  <button onClick={enterLotteryHandler} className='button is-link is-large is-light mt-3'>Play now</button>
                </section>
                <section className='mt-6'>
                  <p><b>Admin only:</b> Pick winner</p>
                  <button onClick={pickWinnerHandler} className='button is-primary is-large is-light mt-3'>Pick winner</button>
                </section>
                <section className='mt-6'>
                  <p><b>Admin only:</b> Pay winner</p>
                  <button onClick={payWinnerHandler} className='button is-success is-large is-light mt-3'>Pay winner</button>
                </section>
                <section>
                  <div className='container has-text-danger mt-6'>
                    <p>{error}</p>
                  </div>
                </section>
                <section>
                  <div className='container has-text-success mt-6'>
                    <p>{successMsg}</p>
                  </div>
                </section>
              </div>
              <div className={`${styles.lotteryInfo} column is-one-third`}>
                <section className='mt-5'>
                  <div className='card'>
                    <div className='card-content'>
                      <div className='content'>
                        <h2>Lottery History</h2>
                        {
                          (lotteryHistory && lotteryHistory.length > 0) && lotteryHistory.map(item => {
                            if (lotteryId != item.id) {
                              return <div className='history-entry mt-3' key={item.id}>
                                <div>Lottery #{item.id} winner:</div>
                                <div>
                                  <a href={`https://etherscan.io/address/${item.address}`}>
                                    {item.address}
                                  </a>
                                </div>
                              </div>
                            }
                          })
                        }
                      </div>
                    </div>
                  </div>
                </section>
                <section className='mt-5'>
                  <div className='card'>
                    <div className='card-content'>
                      <div className='content'>
                        <h2>Player ({lotteryPlayers.length})</h2>
                        <ul className='ml-0'>
                          {
                            (lotteryPlayers && lotteryPlayers.length > 0) && lotteryPlayers.map((player, index) => {
                              return <li key={`${player}-${index}`}>
                                <a href={`https://etherscan.io/address/${player}`}>
                                  {player}
                                </a>
                              </li>
                            })
                          }
                        </ul>
                      </div>
                    </div>
                  </div>
                </section>
                <section className='mt-5'>
                  <div className='card'>
                    <div className='card-content'>
                      <div className='content'>
                        <h2>Pot</h2>
                        <p>{lotteryPot} Ether</p>
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </section>
        </div>
      </main>

      <footer className={styles.footer}>
        <p>2022 Block Explorer</p>
      </footer>
    </div>
  )
}
